-- Update products with new categories and prices
DELETE FROM products;

INSERT INTO products (name, description, price, discount_price, stock, category, features) VALUES
('Normal Bulb 9W', 'Energy-efficient LED bulb for everyday use', 50, 45, 100, 'Normal Bulb', ARRAY['9W power consumption', 'Long-lasting', 'Eco-friendly']),
('Tube Light 18W', 'Bright tube light for classrooms and labs', 130, 115, 50, 'Tube Light', ARRAY['18W power', 'Wide area coverage', 'Energy saving']),
('Inverter Bulb 12W', 'Works on inverter backup power', 190, 170, 75, 'Inverter Bulb', ARRAY['12W power', 'Inverter compatible', 'Long backup']),
('Ceiling Light 24W', 'Premium ceiling light - Contact for pricing', 9999, NULL, 30, 'Ceiling Light', ARRAY['24W LED', 'Modern design', 'Wide coverage']);