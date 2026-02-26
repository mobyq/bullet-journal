'use client'

import { useState, useEffect, useRef } from 'react'

type BulletType = 'task' | 'event' | 'note'
type BulletStatus = 'pending' | 'completed' | 'migrated' | 'cancelled'

interface Collection {
  id: string
  name: string
  icon: string
  color: string
  description: string | null
  order: number
  _count?: { entries: number }
}

interface BulletEntry {
  id: string
  content: string
  type: BulletType
  status: BulletStatus
  date: string
  collectionId: string
  collection: Collection
  createdAt: string
}

const BULLET_SYMBOLS = {
  task: { pending: '○', completed: '●', migrated: '→', cancelled: '×' },
  event: '○',
  note: '—'
}

const DEFAULT_COLLECTIONS = [
  { name: '日记', icon: '📖', color: '#8B7355', description: '每日记录' },
  { name: '正念', icon: '🧘', color: '#6B8E7A', description: '冥想与正念笔记' },
  { name: '工作', icon: '💼', color: '#5B6B8C', description: '工作相关事项' },
  { name: '学习', icon: '📚', color: '#8C6B5B', description: '学习笔记' },
  { name: '灵感', icon: '✨', color: '#9B7B8C', description: '灵感与创意' },
]

export default function BulletJournal() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [entries, setEntries] = useState<BulletEntry[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const initializedRef = useRef(false)
  const lastLoadRef = useRef({ collection: '', date: '' })
  
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState<BulletType>('note')
  const [showNewCollection, setShowNewCollection] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionIcon, setNewCollectionIcon] = useState('📝')

  const fetchCollections = async (): Promise<Collection[]> => {
    try {
      const res = await fetch('/api/collections')
      const data = await res.json()
      setCollections(data)
      return data
    } catch { return [] }
  }

  const fetchEntries = async (collectionId: string, date: string) => {
    try {
      const res = await fetch(`/api/entries?collectionId=${collectionId}&date=${date}`)
      const data = await res.json()
      setEntries(data)
    } catch { setEntries([]) }
  }

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true
    const init = async () => {
      const data = await fetchCollections()
      if (data && data.length > 0) {
        setSelectedCollection(data[0].id)
        await fetchEntries(data[0].id, new Date().toISOString().split('T')[0])
      }
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (!selectedCollection || !selectedDate) return
    if (lastLoadRef.current.collection === selectedCollection && lastLoadRef.current.date === selectedDate) return
    lastLoadRef.current = { collection: selectedCollection, date: selectedDate }
    const timer = setTimeout(() => fetchEntries(selectedCollection, selectedDate), 0)
    return () => clearTimeout(timer)
  }, [selectedCollection, selectedDate])

  const initDefaultCollections = async () => {
    for (const col of DEFAULT_COLLECTIONS) {
      await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(col)
      })
    }
    const data = await fetchCollections()
    if (data && data.length > 0) setSelectedCollection(data[0].id)
  }

  const createCollection = async () => {
    if (!newCollectionName.trim()) return
    await fetch('/api/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCollectionName, icon: newCollectionIcon, color: '#8B7355' })
    })
    setNewCollectionName('')
    setNewCollectionIcon('📝')
    setShowNewCollection(false)
    await fetchCollections()
  }

  const createEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newContent.trim() || !selectedCollection) return
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent, type: newType, status: 'pending', date: selectedDate, collectionId: selectedCollection })
    })
    const entry = await res.json()
    setEntries(prev => [entry, ...prev])
    setNewContent('')
  }

  const updateEntryStatus = async (id: string, status: BulletStatus) => {
    const res = await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    })
    const updated = await res.json()
    setEntries(prev => prev.map(e => e.id === id ? updated : e))
  }

  const deleteEntry = async (id: string) => {
    await fetch(`/api/entries/${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const getBulletSymbol = (entry: BulletEntry) => entry.type === 'task' ? BULLET_SYMBOLS.task[entry.status] : BULLET_SYMBOLS[entry.type]
  const navigateDate = (direction: number) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + direction)
    setSelectedDate(date.toISOString().split('T')[0])
  }
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return `${date.getMonth() + 1}月${date.getDate()}日 ${days[date.getDay()]}`
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a756d' }}>加载中...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f5', display: 'flex' }}>
      <aside style={{ width: '16rem', borderRight: '1px solid #e5ddd2', background: 'rgba(255,253,249,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e5ddd2' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>📓 子弹笔记</h1>
        </div>
        <nav style={{ flex: 1, padding: '0.75rem', overflowY: 'auto' }}>
          {collections.map(collection => (
            <button key={collection.id} onClick={() => setSelectedCollection(collection.id)}
              style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', background: selectedCollection === collection.id ? 'rgba(139,115,85,0.1)' : 'transparent', color: selectedCollection === collection.id ? '#8b7355' : '#2d2a26', border: 'none', cursor: 'pointer', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.125rem' }}>{collection.icon}</span>
              <span style={{ flex: 1 }}>{collection.name}</span>
              {collection._count && <span style={{ fontSize: '0.75rem', color: '#7a756d' }}>{collection._count.entries}</span>}
            </button>
          ))}
          <button onClick={() => setShowNewCollection(true)} style={{ width: '100%', textAlign: 'left', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#7a756d', border: 'none', cursor: 'pointer', background: 'transparent' }}>
            <span style={{ fontSize: '1.125rem' }}>+</span><span>新建集合</span>
          </button>
        </nav>
        {collections.length === 0 && (
          <div style={{ padding: '1rem', borderTop: '1px solid #e5ddd2' }}>
            <button onClick={initDefaultCollections} style={{ width: '100%', padding: '0.5rem 1rem', background: '#8b7355', color: '#fffdf9', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>初始化默认集合</button>
          </div>
        )}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: '1px solid #e5ddd2', padding: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,253,249,0.3)' }}>
          <button onClick={() => navigateDate(-1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>←</button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 500 }}>{formatDate(selectedDate)}</h2>
            <p style={{ fontSize: '0.875rem', color: '#7a756d' }}>{collections.find(c => c.id === selectedCollection)?.icon} {collections.find(c => c.id === selectedCollection)?.name || '选择集合'}</p>
          </div>
          <button onClick={() => navigateDate(1)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>→</button>
        </header>

        <div style={{ borderBottom: '1px solid #e5ddd2', padding: '1rem', background: 'rgba(255,253,249,0.2)' }}>
          <form onSubmit={createEntry}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {(['note', 'task', 'event'] as BulletType[]).map(type => (
                <button key={type} type="button" onClick={() => setNewType(type)} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.875rem', border: 'none', cursor: 'pointer', background: newType === type ? '#fffdf9' : 'transparent', color: newType === type ? '#2d2a26' : '#7a756d' }}>
                  {type === 'note' ? '— 笔记' : type === 'task' ? '○ 任务' : '○ 事件'}
                </button>
              ))}
              <button type="button" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem', color: '#7a756d', background: 'transparent', border: 'none', cursor: 'pointer' }}>今天</button>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: '#7a756d', fontSize: '1.125rem' }}>{newType === 'note' ? '—' : '○'}</span>
              <input type="text" value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="写下你的想法..." style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '1rem', color: '#2d2a26' }} autoFocus />
              <button type="submit" disabled={!newContent.trim()} style={{ padding: '0.25rem 1rem', background: '#8b7355', color: '#fffdf9', borderRadius: '0.5rem', border: 'none', cursor: 'pointer', opacity: newContent.trim() ? 1 : 0.5 }}>添加</button>
            </div>
          </form>
        </div>

        <div className="paper-texture" style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
          {entries.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#7a756d', padding: '3rem' }}>
              <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</p>
              <p>这里还没有内容</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>开始记录你的第一条笔记吧</p>
            </div>
          ) : (
            <div style={{ maxWidth: '42rem', margin: '0 auto' }}>
              {entries.map((entry, index) => (
                <div key={entry.id} className="animate-fade-in" style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', opacity: entry.status === 'completed' ? 0.6 : 1, animationDelay: `${index * 30}ms` }}>
                  <button onClick={() => entry.type === 'task' && updateEntryStatus(entry.id, entry.status === 'pending' ? 'completed' : 'pending')} style={{ fontSize: '1.125rem', background: 'transparent', border: 'none', cursor: entry.type === 'task' ? 'pointer' : 'default', color: entry.status === 'completed' ? '#8b7355' : entry.status === 'cancelled' ? '#c45c4a' : entry.type === 'event' ? '#6b8e7a' : '#7a756d', textDecoration: entry.status === 'completed' || entry.status === 'cancelled' ? 'line-through' : 'none' }}>{getBulletSymbol(entry)}</button>
                  <span style={{ flex: 1, lineHeight: 1.5, textDecoration: entry.status === 'completed' || entry.status === 'cancelled' ? 'line-through' : 'none', color: entry.status === 'completed' || entry.status === 'cancelled' ? '#7a756d' : '#2d2a26' }}>{entry.content}</span>
                  <button onClick={() => deleteEntry(entry.id)} style={{ fontSize: '0.875rem', padding: '0 0.5rem', color: '#7a756d', background: 'transparent', border: 'none', cursor: 'pointer' }}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer style={{ borderTop: '1px solid #e5ddd2', padding: '0.75rem', background: 'rgba(255,253,249,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.75rem', color: '#7a756d' }}>
            <span>○ 待办任务</span><span>● 已完成</span><span>— 笔记</span><span>→ 已迁移</span><span>× 已取消</span>
          </div>
        </footer>
      </main>

      {showNewCollection && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: '#fffdf9', borderRadius: '0.75rem', padding: '1.5rem', width: '20rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e5ddd2' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>新建集合</h3>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#7a756d', display: 'block', marginBottom: '0.25rem' }}>图标</label>
              <input type="text" value={newCollectionIcon} onChange={(e) => setNewCollectionIcon(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#faf8f5', border: '1px solid #e5ddd2', borderRadius: '0.5rem' }} placeholder="📝" />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#7a756d', display: 'block', marginBottom: '0.25rem' }}>名称</label>
              <input type="text" value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} style={{ width: '100%', padding: '0.5rem 0.75rem', background: '#faf8f5', border: '1px solid #e5ddd2', borderRadius: '0.5rem' }} placeholder="集合名称" autoFocus />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
              <button onClick={() => setShowNewCollection(false)} style={{ flex: 1, padding: '0.5rem', border: '1px solid #e5ddd2', borderRadius: '0.5rem', background: 'transparent', cursor: 'pointer' }}>取消</button>
              <button onClick={createCollection} style={{ flex: 1, padding: '0.5rem', background: '#8b7355', color: '#fffdf9', borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
