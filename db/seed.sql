-- Produtos importados da folha de cálculo original.
-- Só corre se a tabela estiver vazia (não sobrescreve edições futuras).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products) THEN
    INSERT INTO products (name, category, price_cents, active, sort) VALUES
      ('Carne de cobra',            'Comida',     100, true,  1),
      ('Peixe suculento assado',    'Comida',     150, true,  2),
      ('Peixe de carne macia assado','Comida',    150, true,  3),
      ('Café do saloon',            'Bebidas',    200, true,  4),
      ('Chá de ervas',              'Bebidas',    100, true,  5),
      ('Limonada',                  'Bebidas',    140, true,  6),
      ('Isco de milho',             'Pesca',       10, true,  7),
      ('Isco de pão',               'Pesca',       10, true,  8),
      ('Carne de veado',            'Comida',     100, true,  9),
      ('Peixe de carne firme',      'Comida',     120, true, 10),
      ('Pão de milho',              'Comida',     190, true, 11),
      ('Guisado de carne fibrosa',  'Comida',     135, true, 12),
      ('Guisado de frango',         'Comida',     200, true, 13),
      ('Veneno de cobra',           'Artesanato', 150, true, 14),
      ('Pequeno-almoço completo',   'Comida',     165, true, 15),
      ('Whiskey (4 copos)',         'Bebidas',    300, true, 16),
      ('Carne de aligátor',         'Comida',      70, true, 17),
      ('Guisado da casa',           'Comida',     181, true, 18),
      ('Guisado de carne de vaca',  'Comida',     145, true, 19),
      ('Guisado de coelho',         'Comida',     190, true, 20),
      ('Guisado de peixe',          'Comida',     160, true, 21),
      ('Cerveja do saloon',         'Bebidas',    100, true, 22),
      ('Sidra fermentada',          'Bebidas',    150, true, 23),
      ('Cubos de açúcar',           'Artesanato',  50, true, 24),
      ('Velas moldadas',            'Artesanato', 130, true, 25),
      ('Feijão com bacon',          'Comida',     160, true, 26),
      ('Carne grossa',              'Comida',     100, true, 27),
      ('Guisado de carneiro',       'Comida',     250, true, 28),
      ('Guisado de caça',           'Comida',     200, true, 29),
      ('Guisado de porco',          'Comida',     220, true, 30),
      ('Guisado de veado',          'Comida',     250, true, 31),
      ('Charuto enrolado',          'Artesanato', 125, true, 32),
      ('Sabão rústico',             'Artesanato',  90, true, 33),
      ('Vinho',                     'Bebidas',    200, true, 34),
      ('Queijo fresco',             'Comida',     140, true, 35);
  END IF;
END $$;

SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
