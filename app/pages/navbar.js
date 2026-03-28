import Link from 'next/link';

export default function Navbar() {
  return (
    <div>
      <p>hello there.</p>
      <Link href="/">
        <button
          style={{
            backgroundColor: 'blue',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Hello
        </button>
      </Link>
    </div>
  );
}