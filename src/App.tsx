
import React, { useEffect, useState } from 'react';

// Interfaces for API response
interface R2Object {
    key: string;
    size: number;
    uploaded: string;
}
interface R2Listing {
    objects: R2Object[];
    delimitedPrefixes: string[];
}

function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function App() {
    const [currentPath, setCurrentPath] = useState('');
    const [items, setItems] = useState<R2Listing>({ objects: [], delimitedPrefixes: [] });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/list?prefix=${currentPath}`)
            .then(res => {
                if (!res.ok) throw new Error('API Error');
                return res.json() as Promise<R2Listing>;
            })
            .then(data => {
                setItems(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [currentPath]);

    const handleNavigate = (prefix: string) => {
        setCurrentPath(prefix);
    };

    const handleUp = () => {
        if (!currentPath) return;
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = parts.length > 0 ? parts.join('/') + '/' : '';
        setCurrentPath(newPath);
    };

    return (
        <div style={{ padding: '40px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', maxWidth: '800px', margin: '0 auto', color: '#111' }}>
            <header style={{ marginBottom: '30px', borderBottom: '1px solid #eaeaea', paddingBottom: '20px' }}>
                <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 600 }}>Grocery Browser</h1>
            </header>

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
                <button
                    onClick={handleUp}
                    disabled={!currentPath}
                    style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #eaeaea',
                        background: currentPath ? '#fff' : '#f5f5f5',
                        cursor: currentPath ? 'pointer' : 'default',
                        color: currentPath ? '#333' : '#999',
                        fontSize: '14px'
                    }}
                >
                    ⬆️ Up
                </button>
                <div style={{ background: '#f5f5f5', padding: '8px 12px', borderRadius: '6px', fontSize: '14px', flex: 1, fontFamily: 'monospace' }}>
                    /{currentPath}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Loading...</div>
            ) : (
                <div style={{ border: '1px solid #eaeaea', borderRadius: '8px', overflow: 'hidden' }}>

                    {items.delimitedPrefixes.length === 0 && items.objects.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>Empty directory</div>
                    )}

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {items.delimitedPrefixes.map(prefix => {
                            const name = prefix.replace(currentPath, '').replace('/', '');
                            return (
                                <li key={prefix} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <button
                                        onClick={() => handleNavigate(prefix)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            width: '100%',
                                            padding: '12px 16px',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'background 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <span style={{ marginRight: '10px', fontSize: '20px' }}>📁</span>
                                        <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{name}/</span>
                                    </button>
                                </li>
                            );
                        })}
                        {items.objects.map(obj => {
                            const name = obj.key.replace(currentPath, '');
                            return (
                                <li key={obj.key} style={{ borderBottom: '1px solid #f5f5f5' }}>
                                    <a
                                        href={`/api/file/${encodeURIComponent(obj.key)}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            textDecoration: 'none',
                                            color: '#333',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                    >
                                        <span style={{ marginRight: '10px', fontSize: '20px' }}>📄</span>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888', marginLeft: '20px' }}>
                                            {formatSize(obj.size)}
                                        </div>
                                    </a>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default App;
