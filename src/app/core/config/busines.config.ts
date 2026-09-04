export const BUSINESS = {
  name: 'Doña Yacki',
  tagline: 'Chickens & Burgers',
  address: 'Mz M2 Lt 33, Jardines de Chillón',
  whatsappNumber: '51902458936', // formato internacional sin '+' para wa.me
  whatsappDisplay: '902 458 936',
  hours: 'Todos los días de 12:00 pm a 11:00 pm', // referencial, editable
  social: {
    instagram: 'https://instagram.com/donayacki_oficial',
    facebook: 'https://facebook.com/donayacki',
    tiktok: 'https://tiktok.com/@donayacki',
  },
  paymentMethods: ['Yape', 'Plin', 'Efectivo', 'Tarjeta (Izipay)', 'Transferencia'],
  // Coordenadas aproximadas de Jardines de Chillón, Puente Piedra — ajustar a la ubicación real del local.
  mapEmbedUrl:
    'https://www.google.com/maps?q=Jardines+de+Chill%C3%B3n,+Puente+Piedra,+Lima&output=embed',
  mapLink: 'https://www.google.com/maps/search/?api=1&query=Jardines+de+Chill%C3%B3n+Puente+Piedra+Lima',
};

/** Arma el link de WhatsApp con un mensaje pre-armado. */
export function whatsappOrderLink(customMessage?: string): string {
  const msg =
    customMessage ??
    'Hola, quiero hacer un pedido en Doña Yacki 🐔. Este es mi pedido: [plato/cantidad], dirección de entrega: [tu dirección]. ¡Gracias!';
  return `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(msg)}`;
}
