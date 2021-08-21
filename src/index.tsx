import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import './index.scss';
import { start } from './jiglibjs2/stunts';

function Layout() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      start(canvasRef.current);
    }
    return () => {};
  });
  return (
    <>
      <h1 className="layout">Welcome!</h1>
      <canvas ref={canvasRef}  width="960" height="600"/>
      <div id="notifications"></div>
    </>
  );
}

ReactDOM.render(<Layout />, document.getElementById('root'));
