export default function Navbar() {
  return (
    <div
      style={{
        position: 'absolute',
        left: '10%',
        top: '10%',
        backgroundColor: 'rgb(240, 240, 240)',
        border: '2px solid white',
        borderRadius: '10px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px'
      }}
    >
      <div style={{ color: 'black', fontWeight: 'bold' }}>Dashboard</div>
      <div style={{ color: 'black', fontWeight: 'bold' }}>My Newsletters</div>
      <div style={{ color: 'black', fontWeight: 'bold' }}>Settings</div>
    </div>
  );
}