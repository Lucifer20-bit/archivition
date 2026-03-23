/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { auth, db, logout, handleFirestoreError, OperationType } from './firebase';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Editor } from './components/Editor/Editor';
import { Marketplace } from './components/Marketplace/Marketplace';
import { MarketingStudio } from './components/Marketing/MarketingStudio';
import { Login } from './components/Auth/Login';
import { Plan } from './types';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [marketplacePlans, setMarketplacePlans] = useState<Plan[]>([]);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [marketingPlan, setMarketingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Fetch user's plans
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'plans'), where('authorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setPlans(plansData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'plans');
    });

    return () => unsubscribe();
  }, [user]);

  // Fetch marketplace plans
  useEffect(() => {
    const q = query(collection(db, 'plans'), where('isPublic', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const plansData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
      setMarketplacePlans(plansData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'plans');
    });

    return () => unsubscribe();
  }, []);

  const handleSavePlan = async (planData: Partial<Plan>) => {
    if (!user) return;

    try {
      if (editingPlan) {
        const planRef = doc(db, 'plans', editingPlan.id);
        await updateDoc(planRef, planData);
      } else {
        const newPlan = {
          ...planData,
          authorId: user.uid,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPublic: false,
          walls: planData.walls || [],
          name: planData.name || 'Untitled Plan',
        };
        await addDoc(collection(db, 'plans'), newPlan);
      }
      setActiveTab('dashboard');
      setEditingPlan(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'plans');
    }
  };

  const handleUpdatePlan = async (planData: Partial<Plan>) => {
    if (!marketingPlan) return;
    try {
      const planRef = doc(db, 'plans', marketingPlan.id);
      await updateDoc(planRef, planData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'plans');
    }
  };

  if (!isAuthReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-zinc-400" size={48} />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      user={user} 
      onLogout={logout}
    >
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 shadow-xl animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-800 text-sm font-medium">{error}</p>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <Dashboard 
          plans={plans} 
          onNewPlan={() => {
            setEditingPlan(null);
            setActiveTab('editor');
          }}
          onEditPlan={(plan) => {
            setEditingPlan(plan);
            setActiveTab('editor');
          }}
        />
      )}

      {activeTab === 'editor' && (
        <Editor 
          onSave={handleSavePlan} 
          initialPlan={editingPlan || undefined} 
        />
      )}

      {activeTab === 'marketplace' && (
        <Marketplace 
          plans={marketplacePlans} 
          onViewPlan={(plan) => {
            setEditingPlan(plan);
            setActiveTab('editor');
          }}
          onBuyPlan={(plan) => {
            alert(`Purchase flow for ${plan.name} would start here.`);
          }}
        />
      )}

      {activeTab === 'marketing' && (
        <MarketingStudio 
          plan={marketingPlan || (plans.length > 0 ? plans[0] : null)} 
          onUpdatePlan={handleUpdatePlan}
        />
      )}
    </Layout>
  );
}
