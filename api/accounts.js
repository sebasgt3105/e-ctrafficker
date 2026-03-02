export default async function handler(req, res) {
  const META_TOKEN = "EAANDjEMkgdwBQtZB6dLleivFDdwEGp82JxY6Qh9ZCKdDnaOZAnVGzDZBG0GkV6xHazkZA32BYWbUo6fHYT3EqT6fqSSGYnySo6u4RkQ97uRN0faxKEZBUXNtaDKtI1u3wsAXbqfVIQoeZAckOzOph2a3QBreS6yerrnKDhin5XlG019ZCrTU8sKiYgHYt8dRfn7mZCgZDZD";
  
  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status&access_token=${META_TOKEN}`);
    const data = await response.json();
    
    const accounts = (data.data || []).slice(0, 10).map(acc => ({
      id: acc.id,
      name: acc.name || "Cuenta",
      status: acc.account_status === 1 ? "Activa" : "Inactiva"
    }));
    
    res.status(200).json({ accounts, total: accounts.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
