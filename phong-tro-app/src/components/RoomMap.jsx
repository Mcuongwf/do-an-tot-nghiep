export default function RoomMap({ address, title }) {
  if (!address) return null;

  const query = encodeURIComponent(address + ", Việt Nam");
  const src = `https://maps.google.com/maps?q=${query}&output=embed&hl=vi&z=16`;

  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1.5px solid #e5e2da" }}>
      <iframe
        title={title}
        src={src}
        width="100%"
        height="260"
        style={{ border: 0, display: "block" }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
