/**
 * Carta completa de Doña Yacki - Chickens & Burgers.
 * Transcrita de la carta oficial del local (Mz M2 Lt 33, Jardines de Chillón).
 * Centralizada aquí para que /carta, /promociones y el catálogo del
 * checkout (cart.component) usen siempre los mismos datos y precios.
 */

export interface MenuItem {
  name: string;
  price: number; // en soles, referencia principal
  priceLabel?: string; // usar cuando el ítem tiene variantes de precio (ver `variants`)
  description?: string;
  variants?: { label: string; price: number }[];
}

export interface MenuCategory {
  id: string;
  title: string;
  emoji: string;
  items: MenuItem[];
}

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'brasas',
    title: 'Brasas',
    emoji: '🍗',
    items: [
      { name: '1/4 de pollo', price: 12 },
      { name: '1/2 pollo', price: 23 },
      { name: '1 pollo', price: 45 },
    ],
  },
  {
    id: 'mostro-brasa',
    title: 'Mostro Brasa',
    emoji: '🍗',
    items: [
      { name: 'Mostrito', price: 11, description: '1/8 de pollo, arroz chaufa, papas y ensalada' },
      { name: 'Mostro', price: 16, description: '1/4 de pollo, arroz chaufa, papas y ensalada' },
      { name: 'Super Mostro', price: 15, description: '1/4 de pollo, papas, ensalada, Coca-Cola o Inca Kola de 500ml' },
    ],
  },
  {
    id: 'mostro-broaster',
    title: 'Mostro Broaster',
    emoji: '🍗',
    items: [
      { name: 'Mostro Ala', price: 13, description: 'Ala broaster, arroz chaufa, papas y ensalada' },
      { name: 'Mostro Pierna', price: 14, description: 'Pierna broaster, arroz chaufa, papas y ensalada' },
      { name: 'Mostro Encuentro', price: 15, description: 'Encuentro broaster, arroz chaufa, papas y ensalada' },
      { name: 'Mostro Pecho', price: 16, description: 'Pecho broaster, arroz chaufa, papas y ensalada' },
    ],
  },
  {
    id: 'broasters',
    title: 'Broasters',
    emoji: '🍗',
    items: [
      { name: 'Ala', price: 10 },
      { name: 'Pierna', price: 11 },
      { name: 'Encuentro', price: 12 },
      { name: 'Pecho', price: 13 },
    ],
  },
  {
    id: 'piezas-pollo',
    title: 'Piezas de Pollo',
    emoji: '🍗',
    items: [
      { name: '2 pzs + papas', price: 14 },
      { name: '4 pzs + papas', price: 27 },
      { name: '6 pzs + papas', price: 38 },
      { name: '10 pzs + papas', price: 54 },
      { name: 'Box 1', price: 30, description: '4 pzs, papas y Coca-Cola o Inca Kola de 600ml' },
      { name: 'Box 2', price: 43, description: '6 pzs, papas y Coca-Cola o Inca Kola de 600ml' },
      { name: 'Box 3', price: 20, description: '10 pzs, papas y Coca-Cola o Inca Kola de 1L' },
      { name: 'Mostro 2 piezas', price: 20, description: '2 piezas, arroz chaufa, papas y Coca-Cola o Inca Kola de 1L' },
      { name: 'Combo para 4', price: 42, description: '2 piezas, arroz chaufa, papas y Coca-Cola o Inca Kola de 1.5L' },
    ],
  },
  {
    id: 'alitas',
    title: 'Alitas',
    emoji: '🍗',
    items: [
      { name: 'Combo 1', price: 18, description: '5 alitas broaster, papas y ensalada' },
      { name: 'Combo 2', price: 27, description: '5 alitas, papas y ensalada' },
      { name: 'Combo 3', price: 45, description: '10 alitas, papas y ensalada' },
      { name: 'Combo 4', price: 28, description: '3 alitas chaufa, papas y ensalada' },
      { name: 'Combo 5', price: 37, description: '3 alitas chaufa, papas y ensalada' },
    ],
  },
  {
    id: 'salchipapas',
    title: 'Salchipapas',
    emoji: '🌭',
    items: [
      { name: 'Salchiclásica', price: 10, description: 'Papas fritas y hotdog ahumado' },
      { name: 'Salchiroyal', price: 19 },
      { name: 'Salchibrasa', price: 19, description: 'Salchipapa, jamón, queso, huevo y pollo deshilachado' },
      { name: 'Salchibrasa (1/4 brasa)', price: 19, description: 'Salchipapa con 1/4 brasa y ensalada' },
      { name: 'Salchibroaster', price: 19, description: 'Salchipapa con 2 piezas de pollo y ensalada' },
      { name: 'Salchialitas', price: 19, description: 'Salchipapa con 3 alitas y ensalada' },
      { name: 'Salchichaufa', price: 19, description: 'Salchipapa con chaufa de pollo' },
    ],
  },
  {
    id: 'hamburguesas',
    title: 'Hamburguesas',
    emoji: '🍔',
    items: [
      { name: 'Burger Clásica', price: 12, description: 'Hamburguesa de pollo o carne con papas' },
      { name: 'Deshilachada', price: 8, description: 'Hamburguesa de pollo deshilachado con papas' },
      { name: 'Filete', price: 13, description: 'Hamburguesa de filete de pollo con papas' },
      { name: 'Burger Royal', price: 13, description: 'Hamburguesa de pollo o carne, huevo, jamón, queso y papas' },
      { name: 'Burger Mixta', price: 16, description: 'Hamburguesa de pollo o carne, huevo, jamón, queso, chicharrón de prensa, pollo deshilachado y papas' },
    ],
  },
  {
    id: 'don-menu',
    title: 'Don Menú',
    emoji: '🍽️',
    items: [
      { name: 'Pieza de pollo', price: 9, description: '1 pieza de pollo, papas y Pepsi' },
      { name: 'Doble Alita', price: 14, description: '2 alitas broaster, papas y Pepsi' },
      { name: 'Mostrito', price: 14, description: '1/8 brasa, papas y Pepsi' },
    ],
  },
  {
    id: 'adicionales',
    title: 'Adicionales',
    emoji: '➕',
    items: [
      { name: 'Papas fritas', price: 9 },
      { name: 'Arroz blanco', price: 5 },
      { name: 'Alita broaster', price: 6 },
      { name: 'Ensalada', price: 6 },
      { name: 'Hot dog', price: 7 },
      { name: 'Queso o jamón', price: 2, priceLabel: 'S/2 c/u' },
      { name: 'Cremas x3', price: 1 },
    ],
  },
  {
    id: 'chifa-plancha',
    title: 'Chifa y Plancha',
    emoji: '🍳',
    items: [
      { name: 'Chaufa de pollo', price: 11 },
      { name: 'Aeropuerto', price: 13 },
      { name: 'Pechuga a la plancha', price: 18 },
      { name: 'Mostro de pechuga', price: 20 },
    ],
  },
];

export interface Promo {
  name: string;
  price: number;
  description?: string;
}

export const PROMOS_BRASA: Promo[] = [
  { name: 'Pollo + Pepsi', price: 50, description: '1 pollo a la brasa, papas y Pepsi 1.5L' },
  { name: 'Pollo + Coca/Inca', price: 52, description: '1 pollo a la brasa, papas y Coca/Inca 1.5L' },
  { name: 'Pollo + Alitas', price: 52, description: '1 pollo a la brasa, papas, 5 alitas y ensalada' },
  { name: 'Pollo + 1/4 Brasa', price: 54, description: '1 pollo, 1/4 brasa, papas y ensalada' },
  { name: 'Pollo + Chaufa', price: 56, description: '1 pollo, chaufa, papas y ensalada' },
  { name: '2 Pollos', price: 88, description: '2 pollos a la brasa, papas y ensalada' },
  { name: '1/2 Pollo + Pepsi', price: 29, description: '1/2 pollo a la brasa, papas ensalada y Pepsi 1.5L' },
  { name: '1/2 Pollo + Alitas', price: 28, description: '1/2 pollo a la brasa, papas, 3 alitas y ensalada' },
  { name: '1/2 Pollo + Chaufa', price: 33, description: '1/2 pollo a la brasa, chaufa, papas y ensalada' },
  { name: '1/2 Pollo + Chaufa y Gaseosa', price: 40, description: '1/2 pollo, chaufa, papas, ensalada y Pepsi 1.5L' },
  { name: 'Pollo + Yapa', price: 61, description: '1 pollo, papas, ensalada, Pepsi 1.5L y 1 "YAPA": 1/4 brasa, 3 piezas, chaufa o burger royal' },
];

export interface DrinkGroup {
  title: string;
  items: MenuItem[];
}

export const BEBIDAS: DrinkGroup[] = [
  {
    title: 'Coca-Cola / Inca Kola',
    items: [
      { name: 'Personal vidrio', price: 2.5 },
      { name: 'Coca / Inca 600ml', price: 4 },
      { name: 'Inca gordita', price: 5 },
      { name: 'Coca / Inca 1L', price: 7 },
      { name: 'Coca / Inca 1.5L', price: 9 },
      { name: 'Coca / Inca 2.5L', price: 11 },
    ],
  },
  {
    title: 'Medianas',
    items: [
      { name: 'Concordia 355ml', price: 2 },
      { name: 'Fanta 500ml', price: 3.5 },
    ],
  },
  {
    title: 'Cervezas',
    items: [
      { name: 'Cuzqueña Trigo', price: 10 },
      { name: 'Cuzqueña Negra', price: 9 },
      { name: 'Pilsen Callao', price: 9 },
    ],
  },
  {
    title: 'Agua',
    items: [
      { name: 'San Benedictino', price: 2 },
      { name: 'San Carlos', price: 2 },
      { name: 'San Luis', price: 2.5 },
    ],
  },
  {
    title: 'Infusiones',
    items: [
      { name: 'Manzanilla', price: 3 },
      { name: 'Anís', price: 3 },
      { name: 'Té', price: 3 },
    ],
  },
  {
    title: 'Pepsi',
    items: [
      { name: 'Pepsi 355ml', price: 2 },
      { name: 'Pepsi 500ml', price: 3 },
      { name: 'Pepsi Jumbo', price: 4 },
      { name: 'Pepsi 1.5L', price: 7 },
    ],
  },
  {
    title: 'Chicha / Maracuyá',
    items: [
      { name: 'Vaso', price: 2.5 },
      { name: '1/2 litro', price: 5 },
      { name: '1 litro', price: 10 },
    ],
  },
];

/** Datos del local, usados en Inicio, Ubicación y el botón flotante de WhatsApp. */
export const LOCAL_INFO = {
  nombre: 'Doña Yacki - Chickens & Burgers',
  direccion: 'Mz M2 Lt 33, Jardines de Chillón',
  whatsappDelivery: '902458936',
  redes: {
    instagram: '@donayacki_oficial',
    facebook: '@donayacki',
    tiktok: '@donayacki',
  },
  horarios: 'Lunes a Domingo, 12:00 m. – 10:30 p.m.',
  formasPago: ['Yape', 'Plin', 'Efectivo', 'Tarjeta (Visa/Mastercard)', 'Transferencia'],
  // Reemplazar por las coordenadas reales del local en Google Maps.
  mapsEmbedUrl: 'https://www.google.com/maps?q=Jardines+de+Chillon+Mz+M2+Lt+33&output=embed',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Jardines+de+Chillon+Mz+M2+Lt+33',
};
