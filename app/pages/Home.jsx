export default function Home() {
  return (
    <div style={{ minHeight: '100vh', margin: 0, backgroundColor: '#0d0a3d' }}>
      <div
        style={{
          minHeight: '200vh',
          width: '100%',
          background: 'linear-gradient(135deg, #4f46e5, #0ea5e9)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          borderRadius: '20px',
          padding: '40px',
          boxSizing: 'border-box',
          paddingTop: '10%'
        }}
      >
        <h1
          style={{
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center',
            margin: 0,
            marginBottom: '20px',
            fontSize: '2.5rem',
            width: '100%'
          }}
        >
          Hi, thanks for visiting!
        </h1>

        <div
          style={{
            width: '100%',
            maxWidth: '740px',
            textAlign: 'center',
            marginTop: '20px'
          }}
        >
          <h2
            style={{
              color: 'white',
              fontWeight: '700',
              fontSize: '1.8rem',
              marginBottom: '16px'
            }}
          >
            Your custom newsletter
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: 1,
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.4)',
                backgroundColor: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button
              style={{
                padding: '14px 20px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#0f766e',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}