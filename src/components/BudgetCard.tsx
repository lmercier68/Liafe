import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Maximize2, Minimize2, Link, Unlink, Calendar, Trash2, Plus } from 'lucide-react';
import { useCardStore, CARD_COLORS } from '../store/cardStore';
import { ColorPicker } from './ColorPicker';

interface BudgetCardProps {
  id: string;
  title: string;
  content: string;
  isExpanded: boolean;
  isConnecting: boolean;
  color: string;
  budgetType: 'total-available' | 'expenses-tracking';
  budgetData: {
    totalAmount?: number;
    availableAmount?: number;
    expenses?: Array<{
      amount: number;
      description: string;
      date: string;
    }>;
  };
  incomingConnections: Array<{ start: string; end: string }>;
  onConnect: () => void;
}

export function BudgetCard({
  id,
  title,
  content,
  isExpanded,
  isConnecting,
  color,
  budgetType,
  budgetData,
  incomingConnections,
  onConnect
}: BudgetCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localBudgetData, setLocalBudgetData] = useState(budgetData);
  const [newExpense, setNewExpense] = useState({ amount: 0, description: '' });
  
  const updateCard = useCardStore((state) => state.updateCard);
  const deleteCard = useCardStore((state) => state.deleteCard);
  const deleteConnection = useCardStore((state) => state.deleteConnection);
  const toggleCardExpansion = useCardStore((state) => state.toggleCardExpansion);

  const handleSave = () => {
    const totalAmount = Number(localBudgetData.totalAmount) || 0;
    const totalExpenses = (localBudgetData.expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0);
    const availableAmount = budgetType === 'expenses-tracking' ? totalAmount - totalExpenses : Number(localBudgetData.availableAmount) || 0;

    updateCard(id, {
      title: localTitle,
      budgetData: {
        totalAmount,
        availableAmount,
        expenses: (localBudgetData.expenses || []).map(exp => ({
          amount: Number(exp.amount),
          description: String(exp.description),
          date: exp.date
        }))
      }
    });
    setIsEditing(false);
  };

  const handleAddExpense = () => {
    if (newExpense.amount && newExpense.description) {
      const currentExpenses = localBudgetData.expenses || [];
      const updatedExpenses = [
        ...currentExpenses,
        {
          ...newExpense,
          date: new Date().toISOString()
        }
      ];
      const totalSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      setLocalBudgetData({
        ...localBudgetData,
        expenses: updatedExpenses,
        availableAmount: (localBudgetData.totalAmount || 0) - totalSpent
      });
      
      setNewExpense({ amount: 0, description: '' });
    }
  };

  const calculatePercentage = () => {
    if (!localBudgetData.totalAmount) return 0;
    return Math.round((localBudgetData.availableAmount || 0) / localBudgetData.totalAmount * 100);
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 1000 : 1,
    cursor: isDragging ? 'grabbing' : 'grab'
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`absolute transition-all duration-200 border ${
        color ? CARD_COLORS[color as keyof typeof CARD_COLORS] : ''
      } ${isExpanded ? 'w-96 h-80' : 'w-96 h-24'} ${
        isConnecting ? 'ring-2 ring-indigo-500' : ''
      } rounded-lg shadow-lg`}
      id={id}
    >
      <div className="p-4 h-full flex flex-col">
        <div className="flex justify-between items-center mb-2">
          {isEditing ? (
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
            />
          ) : (
            <h3 className="text-lg font-semibold">{title}</h3>
          )}
          <div className="flex gap-2">
            <ColorPicker onColorSelect={(color) => updateCard(id, { color })} currentColor={color} />
            <button
              onClick={onConnect}
              className={`p-1 hover:bg-gray-100 rounded ${
                isConnecting ? 'bg-indigo-100 text-indigo-600' : ''
              }`}
            >
              <Link size={18} />
            </button>
            {incomingConnections.length > 0 && (
              <button
                onClick={() => deleteConnection(incomingConnections[0].start, id)}
                className="p-1 hover:bg-red-100 text-red-600 rounded"
              >
                <Unlink size={18} />
              </button>
            )}
            <button
              onClick={() => deleteCard(id)}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
            >
              <Trash2 size={18} />
            </button>
            {!isEditing &&<button
              onClick={() => toggleCardExpansion(id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>}
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          {budgetType === 'total-available' ? (
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Amount</label>
                    <input
                      type="number"
                      value={localBudgetData.totalAmount || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setLocalBudgetData({
                          ...localBudgetData,
                          totalAmount: value
                        });
                      }}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Available Amount</label>
                    <input
                      type="number"
                      value={localBudgetData.availableAmount || 0}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setLocalBudgetData({
                          ...localBudgetData,
                          availableAmount: value
                        });
                      }}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">${localBudgetData.totalAmount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available:</span>
                    <span className="font-medium">${localBudgetData.availableAmount || 0}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${calculatePercentage()}%` }}
                    />
                  </div>
                  <div className="text-sm text-center text-gray-600">
                    {calculatePercentage()}% available
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Initial Budget</label>
                    <input
                      type="number"
                      value={localBudgetData.totalAmount || 0}
                      onChange={(e) => setLocalBudgetData({
                        ...localBudgetData,
                        totalAmount: parseFloat(e.target.value)
                      })}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Add Expense</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={newExpense.amount || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                          setNewExpense({
                            ...newExpense,
                            amount: value
                          });
                        }}
                        placeholder="Amount"
                        className="w-24 px-2 py-1 border rounded"
                      />
                      <input
                        type="text"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({
                          ...newExpense,
                          description: e.target.value
                        })}
                        placeholder="Description"
                        className="flex-1 px-2 py-1 border rounded"
                      />
                      <button
                        onClick={handleAddExpense}
                        className="p-1 bg-indigo-100 rounded hover:bg-indigo-200"
                        type="button"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Initial Budget:</span>
                    <span className="font-medium">${localBudgetData.totalAmount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spent:</span>
                    <span className="font-medium">
                      ${localBudgetData.expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className="font-medium">${localBudgetData.availableAmount || 0}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${calculatePercentage()}%` }}
                    />
                  </div>
                </div>
              )}
              {isExpanded && budgetType === 'expenses-tracking' && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Recent Expenses</h4>
                  <div className="max-h-24 overflow-auto">
                    {localBudgetData.expenses?.map((expense, index) => (
                      <div key={index} className="flex justify-between items-center py-1 border-b">
                        <span className="text-sm">{expense.description}</span>
                        <span className="text-sm font-medium">${expense.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
       {isExpanded && <div
          className="self-end mt-2 px-3 py-1 text-sm bg-white bg-opacity-50 rounded hover:bg-opacity-100"
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
        >
          <span className="cursor-pointer">
            {isEditing ? 'Save' : 'Edit'}
          </span>
        </div>
        }
      </div>
    </div>
  );
}