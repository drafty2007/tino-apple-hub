// Confirmed public business contact. WhatsApp uses international digits without +.
export const storeContact = {
  phoneDisplay: '057 358 6986',
  phoneInternational: '+233573586986',
  whatsappNumber: '233573586986',
};

export function whatsappLink(message = 'Hello TINO APPLE HUB, I would like to enquire about your phones and accessories.') {
  return `https://wa.me/${storeContact.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
