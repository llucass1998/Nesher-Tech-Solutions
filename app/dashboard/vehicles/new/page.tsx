'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

export default function NewVehiclePage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    model: '',
    plate: '',
    status: 'AVAILABLE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axios.post('http://localhost:3333/vehicles', formData);
      router.push('/dashboard/vehicles');
    } catch (error) {
      console.error('Erro ao criar veículo:', error);
      alert('Erro ao cadastrar veículo. Verifique os dados e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full h-[40px] px-3 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#185FA5] dark:focus:ring-blue-500 focus:border-transparent transition-colors";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";

  return (
    <div className="w-full flex flex-col gap-6">

      {/* HEADER */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm p-4 sm:p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)] dark:text-white">Novo Veículo</h1>
          <p className="text-sm text-[var(--color-text-secondary)] dark:text-gray-400 mt-1">Preencha os dados para cadastrar um novo veículo.</p>
        </div>
        <Link
          href="/dashboard/vehicles"
          className="h-[40px] px-4 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
        >
          <i className="ti ti-arrow-left"></i> Voltar
        </Link>
      </div>

      {/* FORMULÁRIO */}
      <div className="bg-white dark:bg-gray-800 border border-[var(--color-border-secondary)] dark:border-gray-700 rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          <div>
            <label className={labelClass}>Modelo <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.model}
              onChange={e => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ex: Honda CG 160"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Placa <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.plate}
              onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
              placeholder="Ex: ABC-1234"
              className={inputClass}
              required
            />
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className={inputClass}
            >
              <option value="AVAILABLE">Disponível</option>
              <option value="MAINTENANCE">Manutenção</option>
              <option value="INACTIVE">Inativo</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard/vehicles"
              className="h-[40px] px-4 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="h-[40px] px-5 text-sm bg-[#185FA5] hover:bg-[#0C447C] dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors"
            >
              {isSaving ? 'Cadastrando...' : 'Cadastrar veículo'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
