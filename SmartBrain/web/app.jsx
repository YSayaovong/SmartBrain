import React, { useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

function useModelsLoaded() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    async function load() {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      ]);
      setReady(true);
    }
    load().catch(console.error);
  }, []);
  return ready;
}

function FaceRecognition({ imageUrl, boxes }) {
  return (
    <div className="stage">
      <img id="inputImage" src={imageUrl} alt="" crossOrigin="anonymous" />
      {boxes.map((b,i) => (
        <div key={i} className="box" style={{left:b.left, top:b.top, width:b.width, height:b.height}}/>
      ))}
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState('signin');
  const [user, setUser] = useState(null);
  const [url, setUrl] = useState('');
  const [boxes, setBoxes] = useState([]);
  const ready = useModelsLoaded();
  const imgRef = useRef(null);

  const onDetect = async () => {
    if (!ready || !url) return;
    const img = document.getElementById('inputImage');
    if (!img) return;
    const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 }));
    const boxes = detections.map(det => ({
      left: det.box.left, top: det.box.top, width: det.box.width, height: det.box.height
    }));
    setBoxes(boxes);
    if (user) {
      await fetch(`${API_BASE}/image`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id: user.id }) })
        .then(res=>res.json())
        .then(u=>setUser(u))
        .catch(()=>{});
    }
  };

  const onRegister = async (name, email, password) => {
    const res = await fetch(`${API_BASE}/register`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email, password }) });
    const data = await res.json();
    if (data.id) { setUser(data); setRoute('home'); }
  };
  const onSignIn = async (email, password) => {
    const res = await fetch(`${API_BASE}/signin`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ email, password }) });
    const data = await res.json();
    if (data.id) { setUser(data); setRoute('home'); }
  };

  return (
    <main className="wrap">
      <header className="bar">
        <h1>SmartBrain</h1>
        <nav>
          {route==='home' ? <button onClick={()=>{setRoute('signin'); setUser(null);}}>Sign Out</button> :
            <>
              <button onClick={()=>setRoute('signin')}>Sign In</button>
              <button onClick={()=>setRoute('register')}>Register</button>
            </>}
        </nav>
      </header>

      {route==='home' && (
        <>
          <p className="muted">Welcome{user ? `, ${user.name}` : ''}. {user ? <>Detections made: <strong>{user.entries}</strong></> : null}</p>
          <div className="form-row">
            <input type="url" placeholder="Paste an image URL" value={url} onChange={e=>setUrl(e.target.value)} />
            <button onClick={onDetect} disabled={!ready}>Detect</button>
          </div>
          <FaceRecognition imageUrl={url} boxes={boxes} />
        </>
      )}

      {route==='signin' && <Auth mode="signin" onSubmit={onSignIn} />}
      {route==='register' && <Auth mode="register" onSubmit={onRegister} />}

      <section className="note">
        <p><strong>Note:</strong> Place the face-api.js <code>tiny_face_detector</code> model files in <code>/public/models</code> (same origin) so the app can load them.</p>
      </section>
    </main>
  );
}

function Auth({ mode, onSubmit }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  return (
    <form className="panel" onSubmit={(e)=>{e.preventDefault(); onSubmit(mode==='register'?name:email, mode==='register'?email:password, mode==='register'?password:undefined)}}>
      <h2>{mode==='register' ? 'Create account' : 'Sign in'}</h2>
      {mode==='register' && (<input placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />)}
      <input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} required />
      <button type="submit">{mode==='register' ? 'Register' : 'Sign In'}</button>
    </form>
  );
}
