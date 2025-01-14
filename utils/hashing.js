const ENCRYPTION_KEY = "ZGV2b2xvcGVyX3Nway4wMTAzQGdtYWlsLmNvbQ";

function encrypt(input) {
  let key = ENCRYPTION_KEY;
  const encrypted = [];
  for (let i = 0; i < input.length; i++) {
    const charCode = input.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    encrypted.push(String.fromCharCode(charCode));
  }

  return encrypted.join("");
}
function decrypt(encrypted) {
  let key = ENCRYPTION_KEY;
  const decrypted = [];
  for (let i = 0; i < encrypted.length; i++) {
    const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    decrypted.push(String.fromCharCode(charCode));
  }

  return decrypted.join("");
}

module.exports = { decrypt, encrypt };
    