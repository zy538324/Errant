'use client';
import { useState, useEffect } from 'react';
import { getCollections, createCollection, updateCollection, deleteCollection, mergeCollections } from '@/lib/adminApi';

export default function CollectionsPage() {
  const [collections, setCollections] = useState([]);
  const [newName, setNewName] = useState('');

  const fetchCollections = async () => setCollections(await getCollections());

  useEffect(() => { fetchCollections(); }, []);

  const handleCreate = async () => {
    if (!newName) return;
    await createCollection(newName);
    setNewName('');
    fetchCollections();
  };

  const handleMerge = async (sourceId: string, targetId: string) => {
    await mergeCollections(sourceId, targetId);
    fetchCollections();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Collections</h1>
      <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New Collection" />
      <button onClick={handleCreate}>Create</button>
      <ul>
        {collections.map(c => (
          <li key={c.id}>
            {c.name}
            <button onClick={() => deleteCollection(c.id)}>Delete</button>
            {/* Merge button can open a select to pick target collection */}
          </li>
        ))}
      </ul>
    </div>
  );
}