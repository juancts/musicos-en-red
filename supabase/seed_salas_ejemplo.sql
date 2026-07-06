-- Salas de demostración (solo datos en usuarios)
-- Ejecutar DESPUÉS de 001_salas_ensayo.sql
--
-- Si falla por FK con auth.users, usa en su lugar:
--   npm run seed:salas
-- (con SUPABASE_SERVICE_ROLE_KEY en .env.local)

INSERT INTO usuarios (
  id,
  tipo,
  nombre,
  email,
  ciudad,
  codigo_postal,
  provincia,
  bio,
  direccion,
  telefono,
  precio_hora,
  capacidad_max,
  equipamiento,
  horario,
  disponible
)
VALUES
  (
    'a1000001-0001-4001-8001-000000000001',
    'sala',
    'Estudio Norte',
    'demo-estudio-norte@salas.musicosenred.test',
    'Madrid',
    '28003',
    'Madrid',
    'Local amplio con buena insonorización. Ideal para bandas de rock y pop.',
    'Calle de Bravo Murillo, 42',
    '600 111 001',
    18,
    6,
    ARRAY[
      'Batería completa',
      'Amplificador guitarra',
      'Amplificador bajo',
      'PA / microfonía',
      'Aire acondicionado'
    ]::text[],
    'Lun–Dom 10:00–23:00',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000002',
    'sala',
    'Groove Factory',
    'demo-groove-factory@salas.musicosenred.test',
    'Barcelona',
    '08001',
    'Barcelona',
    'Sala moderna en el centro. Perfecta para funk, soul y teclados.',
    'Carrer del Rec, 15',
    '600 222 002',
    22,
    8,
    ARRAY[
      'Batería completa',
      'Amplificador guitarra',
      'Teclado / piano',
      'PA / microfonía',
      'Cabina de grabación'
    ]::text[],
    'Mar–Sáb 11:00–24:00',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000003',
    'sala',
    'Bunker Sonoro',
    'demo-bunker-sonoro@salas.musicosenred.test',
    'Valencia',
    '46001',
    'Valencia',
    'Precio ajustado para grupos en formación. Ambiente relajado.',
    'C/ de Colón, 28',
    '600 333 003',
    14,
    5,
    ARRAY[
      'Batería completa',
      'Amplificador guitarra',
      'Amplificador bajo'
    ]::text[],
    'Lun–Vie 16:00–22:00',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000004',
    'sala',
    'Jam Box Sevilla',
    'demo-jam-box-sevilla@salas.musicosenred.test',
    'Sevilla',
    '41001',
    'Sevilla',
    'Espacio versátil para ensayos y grabaciones demo.',
    'Av. de la Constitución, 12',
    '600 444 004',
    16,
    7,
    ARRAY[
      'Batería completa',
      'PA / microfonía',
      'Cabina de grabación',
      'Aire acondicionado',
      'Parking'
    ]::text[],
    'Todos los días 12:00–01:00',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000005',
    'sala',
    'Riff House',
    'demo-riff-house@salas.musicosenred.test',
    'Bilbao',
    '48001',
    'Bizkaia',
    'Sala orientada a metal y rock alternativo. Backline potente.',
    'Gran Vía, 55',
    '600 555 005',
    20,
    6,
    ARRAY[
      'Batería completa',
      'Amplificador guitarra',
      'Amplificador bajo',
      'PA / microfonía'
    ]::text[],
    'Lun–Dom 15:00–23:30',
    true
  ),
  (
    'a1000001-0001-4001-8001-000000000006',
    'sala',
    'Nave del Ritmo',
    'demo-nave-del-ritmo@salas.musicosenred.test',
    'Málaga',
    '29001',
    'Málaga',
    'Nave diáfana con mucho espacio. Muy demandada los fines de semana.',
    'Calle Larios, 8',
    '600 666 006',
    19,
    10,
    ARRAY[
      'Batería completa',
      'Amplificador guitarra',
      'Amplificador bajo',
      'PA / microfonía',
      'Teclado / piano',
      'Parking'
    ]::text[],
    'Mar–Dom 10:00–22:00',
    false
  )
ON CONFLICT (id) DO UPDATE SET
  tipo = EXCLUDED.tipo,
  nombre = EXCLUDED.nombre,
  email = EXCLUDED.email,
  ciudad = EXCLUDED.ciudad,
  codigo_postal = EXCLUDED.codigo_postal,
  provincia = EXCLUDED.provincia,
  bio = EXCLUDED.bio,
  direccion = EXCLUDED.direccion,
  telefono = EXCLUDED.telefono,
  precio_hora = EXCLUDED.precio_hora,
  capacidad_max = EXCLUDED.capacidad_max,
  equipamiento = EXCLUDED.equipamiento,
  horario = EXCLUDED.horario,
  disponible = EXCLUDED.disponible;
