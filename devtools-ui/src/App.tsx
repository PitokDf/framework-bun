import { useEffect, useState, useMemo } from 'react';
import { Activity, Trash2, Clock, Calendar, AlertCircle, Terminal, Map } from 'lucide-react';
import { format } from 'date-fns';
import './index.css';

interface DevToolsRequestEntry {
  id: string;
  method: string;
  url: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: any;
  responseBody?: string;
  error?: string;
  errorStack?: string;
}

interface DevToolsLogEntry {
  type: "log" | "error" | "warn" | "info";
  message: string;
  timestamp: number;
}

function getStatusClass(status: number) {
  if (status >= 500) return 'status-5xx';
  if (status >= 400) return 'status-4xx';
  if (status >= 300) return 'status-3xx';
  return 'status-2xx';
}

function App() {
  const [requests, setRequests] = useState<DevToolsRequestEntry[]>([]);
  const [logs, setLogs] = useState<DevToolsLogEntry[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'headers' | 'payload' | 'error'>('headers');
  const [mainMenu, setMainMenu] = useState<'requests' | 'logs' | 'routes'>('requests');

  // Fetch initial data
  useEffect(() => {
    fetch('/__buntok/api/requests').then(r => r.json()).then(j => setRequests(j.data || []));
    fetch('/__buntok/api/logs').then(r => r.json()).then(j => setLogs(j.data || []));
    fetch('/__buntok/api/routes').then(r => r.json()).then(j => setRoutes(j.data || []));
    
    // Setup WebSocket for realtime updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/__buntok/api/ws`;
    const ws = new WebSocket(wsUrl);
    
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "console") {
          setLogs(prev => [payload.data, ...prev].slice(0, 500));
        } else {
          setRequests(prev => [payload, ...prev].slice(0, 500));
        }
      } catch (e) {
        console.error("Failed to parse websocket message", e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const formatJsonStr = (str?: string) => {
    if (!str) return '';
    try {
      const obj = JSON.parse(str);
      return JSON.stringify(obj, null, 2);
    } catch {
      return str;
    }
  };

  const clearLogs = async () => {
    try {
      if (mainMenu === 'requests') {
        await fetch('/__buntok/api/requests/clear', { method: 'POST' });
        setRequests([]);
        setSelectedId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const selectedReq = useMemo(() => {
    return requests.find(r => r.id === selectedId) || null;
  }, [requests, selectedId]);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ background: 'var(--text-accent)', padding: '4px', borderRadius: '6px' }}>
            <Activity color="#fff" size={20} />
          </div>
          <h1>Buntok DevTools</h1>
        </div>
        <div className="sidebar-nav">
          <div className={`nav-item ${mainMenu === 'requests' ? 'active' : ''}`} onClick={() => setMainMenu('requests')}>
            <Activity size={18} /> HTTP Requests
          </div>
          <div className={`nav-item ${mainMenu === 'logs' ? 'active' : ''}`} onClick={() => setMainMenu('logs')}>
            <Terminal size={18} /> Console Logs
          </div>
          <div className={`nav-item ${mainMenu === 'routes' ? 'active' : ''}`} onClick={() => setMainMenu('routes')}>
            <Map size={18} /> API Explorer
          </div>
        </div>
        {mainMenu === 'requests' && (
          <div className="sidebar-footer">
            <button onClick={clearLogs} className="btn-clear">
              <Trash2 size={16} /> Clear Logs
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="header">
          <h2 className="header-title" style={{ textTransform: 'capitalize' }}>
            {mainMenu === 'requests' ? 'Incoming Requests' : mainMenu}
          </h2>
        </header>

        <div className="content-wrapper" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {mainMenu === 'requests' && (
            <>
              {/* Requests List Pane */}
              <div className="requests-list">
                {requests.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Waiting for requests...
                  </div>
                ) : (
                  requests.map(req => (
                    <div 
                      key={req.id} 
                      className={`request-item ${selectedId === req.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedId(req.id);
                        setActiveTab(req.error ? 'error' : 'payload');
                      }}
                    >
                      <div className="req-top">
                        <span className={`req-method ${req.method}`}>{req.method}</span>
                        <span className={`req-status ${getStatusClass(req.status)}`}>{req.status}</span>
                      </div>
                      <div className="req-path">{req.path}</div>
                      <div className="req-bottom">
                        <span>{format(req.timestamp, 'HH:mm:ss')}</span>
                        <span>{req.durationMs}ms</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Request Detail Pane */}
              <div className="request-detail">
                {!selectedReq ? (
                  <div className="empty-state">
                    <Activity size={48} opacity={0.5} />
                    <p>Select a request to view details</p>
                  </div>
                ) : (
                  <>
                    <div className="detail-header">
                      <div className="detail-url">{selectedReq.method} {selectedReq.path}</div>
                      <div className="detail-meta">
                        <div className="meta-item">
                          <div className={`req-status ${getStatusClass(selectedReq.status)}`}>
                            {selectedReq.status}
                          </div>
                        </div>
                        <div className="meta-item"><Clock size={16} /> {selectedReq.durationMs} ms</div>
                        <div className="meta-item"><Calendar size={16} /> {format(selectedReq.timestamp, 'yyyy-MM-dd HH:mm:ss')}</div>
                      </div>
                    </div>

                    {selectedReq.error && (
                      <div className="error-block">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <AlertCircle size={20} color="var(--status-5xx)" />
                          <div className="error-title">Exception Caught</div>
                        </div>
                        <div className="error-stack">{selectedReq.error}</div>
                      </div>
                    )}

                    <div className="tabs">
                      <div className={`tab ${activeTab === 'payload' ? 'active' : ''}`} onClick={() => setActiveTab('payload')}>Payload & Body</div>
                      <div className={`tab ${activeTab === 'headers' ? 'active' : ''}`} onClick={() => setActiveTab('headers')}>Headers</div>
                      {selectedReq.error && <div className={`tab ${activeTab === 'error' ? 'active' : ''}`} onClick={() => setActiveTab('error')}>Error Stack</div>}
                    </div>

                    <div className="tab-content">
                      {activeTab === 'payload' && (
                        <>
                          <div className="data-block">
                            <h3>Request Body</h3>
                            {selectedReq.requestBody ? (
                               <pre className="key-value-list" style={{ padding: '16px' }}>{JSON.stringify(selectedReq.requestBody, null, 2)}</pre>
                            ) : <p style={{ color: 'var(--text-muted)' }}>No request body recorded.</p>}
                          </div>
                          <div className="data-block">
                            <h3>Response Body</h3>
                            {selectedReq.responseBody ? (
                               <pre className="key-value-list" style={{ padding: '16px', whiteSpace: 'pre-wrap' }}>{formatJsonStr(selectedReq.responseBody)}</pre>
                            ) : <p style={{ color: 'var(--text-muted)' }}>No response body recorded or response was not JSON.</p>}
                          </div>
                        </>
                      )}

                      {activeTab === 'headers' && (
                        <>
                          <div className="data-block">
                            <h3>Request Headers</h3>
                            {Object.keys(selectedReq.requestHeaders).length > 0 ? (
                              <div className="key-value-list">
                                {Object.entries(selectedReq.requestHeaders).map(([key, value]) => (
                                  <div className="kv-row" key={key}><div className="kv-key">{key}</div><div className="kv-value">{value}</div></div>
                                ))}
                              </div>
                            ) : <p style={{ color: 'var(--text-muted)' }}>No request headers recorded.</p>}
                          </div>
                          <div className="data-block">
                            <h3>Response Headers</h3>
                            {Object.keys(selectedReq.responseHeaders).length > 0 ? (
                              <div className="key-value-list">
                                {Object.entries(selectedReq.responseHeaders).map(([key, value]) => (
                                  <div className="kv-row" key={key}><div className="kv-key">{key}</div><div className="kv-value">{value}</div></div>
                                ))}
                              </div>
                            ) : <p style={{ color: 'var(--text-muted)' }}>No response headers recorded.</p>}
                          </div>
                        </>
                      )}

                      {activeTab === 'error' && selectedReq.errorStack && (
                        <div className="data-block">
                          <h3>Stack Trace</h3>
                          <div className="key-value-list" style={{ padding: '16px', background: 'rgba(0,0,0,0.2)' }}>
                            <pre className="error-stack">{selectedReq.errorStack}</pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {mainMenu === 'logs' && (
            <div className="request-detail" style={{ width: '100%' }}>
              <div className="data-block">
                <h3>Terminal Logs intercept</h3>
                <div className="key-value-list" style={{ background: 'var(--bg-secondary)' }}>
                  {logs.map((l, i) => (
                    <div key={i} style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-primary)', fontFamily: 'monospace', color: l.type === 'error' ? 'var(--status-5xx)' : l.type === 'warn' ? 'var(--status-4xx)' : 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--text-secondary)', marginRight: '16px' }}>{format(l.timestamp, 'HH:mm:ss')}</span>
                      [{l.type.toUpperCase()}] {l.message}
                    </div>
                  ))}
                  {logs.length === 0 && <div style={{ padding: '16px', color: 'var(--text-secondary)' }}>No logs intercepted yet. Try console.log() in your code!</div>}
                </div>
              </div>
            </div>
          )}

          {mainMenu === 'routes' && (
            <div className="request-detail" style={{ width: '100%' }}>
              <div className="data-block">
                <h3>Registered API Routes</h3>
                <div className="key-value-list">
                   {routes.map((rt, i) => (
                      <div className="kv-row" key={i}>
                         <div className="kv-key" style={{ width: '120px', fontWeight: 'bold', color: 'var(--method-get)', textTransform: 'uppercase' }}>{rt.method}</div>
                         <div className="kv-value">{rt.path}</div>
                      </div>
                   ))}
                   {routes.length === 0 && <div style={{ padding: '16px', color: '#666' }}>No routes registered yet.</div>}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
