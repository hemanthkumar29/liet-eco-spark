import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-idempotency-key',
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  quantity: number;
}

interface OrderRequest {
  customer_name: string;
  address: string;
  mobile_number: string;
  whatsapp_number: string;
  student_roll: string;
  department: string;
  year: string;
  section: string;
  items: OrderItem[];
}

function generateOrderId(): string {
  const now = new Date();
  
  // Convert to Asia/Kolkata timezone for display format
  const kolkataTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const year = kolkataTime.getFullYear();
  const month = String(kolkataTime.getMonth() + 1).padStart(2, '0');
  const day = String(kolkataTime.getDate()).padStart(2, '0');
  const hours = String(kolkataTime.getHours()).padStart(2, '0');
  const minutes = String(kolkataTime.getMinutes()).padStart(2, '0');
  const seconds = String(kolkataTime.getSeconds()).padStart(2, '0');
  
  // Generate short hash from random UUID
  const randomStr = crypto.randomUUID() + Date.now();
  const hash = createHash('md5').update(randomStr).digest('hex');
  const shortHash = hash.toString().substring(0, 6).toUpperCase();
  
  return `LIET-ORD-${year}${month}${day}-${hours}${minutes}${seconds}-${shortHash}`;
}

async function logAudit(
  supabase: any,
  action: string,
  orderId: string | null,
  userRoll: string | null,
  payload: any,
  errorCode: string | null,
  req: Request
) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  await supabase.from('order_audit').insert({
    action,
    order_id: orderId,
    user_roll: userRoll,
    payload,
    ip_address: ip,
    user_agent: userAgent,
    error_code: errorCode,
  });
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const idempotencyKey = req.headers.get('x-idempotency-key');
    const orderData: OrderRequest = await req.json();

    // Validate input
    if (!orderData.customer_name || !orderData.address || !orderData.mobile_number || 
        !orderData.whatsapp_number || !orderData.student_roll || !orderData.department ||
        !orderData.year || !orderData.section || !orderData.items || orderData.items.length === 0) {
      await logAudit(supabase, 'failed', null, orderData.customer_name, orderData, 'VALIDATION_ERROR', req);
      return new Response(
        JSON.stringify({ error: 'Missing required fields', code: 'VALIDATION_ERROR' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check idempotency
    if (idempotencyKey) {
      const { data: existingOrder } = await supabase
        .from('orders')
        .select('*')
        .eq('idempotency_key', idempotencyKey)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .single();

      if (existingOrder) {
        console.log('Returning existing order for idempotency key:', idempotencyKey);
        return new Response(
          JSON.stringify({ order: existingOrder, message: 'Order already exists' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Start transaction-like processing
    let totalAmount = 0;
    let hasPendingPrice = false;
    const pendingItems: string[] = [];
    const validatedItems = [];

    // Lock and validate each product
    for (const item of orderData.items) {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id, name, price, discount_price, quantity_available, in_stock')
        .eq('id', item.id)
        .single();

      if (productError || !product) {
        await logAudit(supabase, 'failed', null, orderData.customer_name, orderData, 'PRODUCT_NOT_FOUND', req);
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.name}`, code: 'PRODUCT_NOT_FOUND', itemId: item.id }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check stock availability
      if (!product.in_stock || product.quantity_available < item.quantity) {
        await logAudit(supabase, 'failed', null, orderData.customer_name, orderData, 'OUT_OF_STOCK', req);
        return new Response(
          JSON.stringify({
            error: `Insufficient stock for ${product.name}`,
            code: 'OUT_OF_STOCK',
            itemId: product.id,
            available: product.quantity_available || 0
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculate price
      const itemPrice = product.discount_price || product.price;
      
      if (itemPrice === null || itemPrice >= 9999) {
        // Price is pending (NULL or placeholder high price)
        hasPendingPrice = true;
        pendingItems.push(product.name);
      } else {
        totalAmount += itemPrice * item.quantity;
      }

      validatedItems.push({
        ...item,
        price: product.price,
        discount_price: product.discount_price,
      });

      // Decrement stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity_available: product.quantity_available - item.quantity })
        .eq('id', product.id);

      if (updateError) {
        console.error('Failed to update stock:', updateError);
        await logAudit(supabase, 'failed', null, orderData.customer_name, orderData, 'STOCK_UPDATE_ERROR', req);
        return new Response(
          JSON.stringify({ error: 'Failed to reserve stock', code: 'STOCK_UPDATE_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate unique order ID with retry
    let orderId = '';
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      orderId = generateOrderId();
      
      // Check if order ID already exists
      const { data: existing } = await supabase
        .from('orders')
        .select('order_id')
        .eq('order_id', orderId)
        .single();

      if (!existing) break;
      
      attempts++;
      if (attempts >= maxAttempts) {
        await logAudit(supabase, 'failed', null, orderData.customer_name, orderData, 'ORDER_ID_COLLISION', req);
        return new Response(
          JSON.stringify({ error: 'Failed to generate unique order ID', code: 'ORDER_ID_COLLISION' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Prepare notes for pending prices
    let notes = null;
    if (hasPendingPrice) {
      notes = `Price pending for: ${pendingItems.join(', ')} — admin will update price.`;
    }

    // Get user ID from auth header if available
    const authHeader = req.headers.get('authorization');
    let userId = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Insert order
    const { data: newOrder, error: insertError } = await supabase
      .from('orders')
      .insert({
        order_id: orderId,
        customer_name: orderData.customer_name,
        address: orderData.address,
        mobile_number: orderData.mobile_number,
        whatsapp_number: orderData.whatsapp_number,
        student_roll: orderData.student_roll,
        department: orderData.department,
        year: orderData.year,
        section: orderData.section,
        products: validatedItems,
        total_amount: hasPendingPrice ? null : totalAmount,
        price_pending: hasPendingPrice,
        notes: notes,
        status: 'Confirmed',
        idempotency_key: idempotencyKey,
        user_id: userId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Order insertion error:', insertError);
      await logAudit(supabase, 'failed', orderId, orderData.customer_name, orderData, 'INSERT_ERROR', req);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create order', code: 'INSERT_ERROR', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful order creation
    await logAudit(supabase, 'created', orderId, orderData.customer_name, orderData, null, req);

    console.log('Order created successfully:', orderId);

    return new Response(
      JSON.stringify({
        order: newOrder,
        message: hasPendingPrice ? 'Order confirmed - some prices pending admin update' : 'Order confirmed',
        price_pending: hasPendingPrice,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', code: 'INTERNAL_ERROR', message: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
