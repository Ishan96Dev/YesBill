// Copyright (c) 2025 Ishan Chakraborty. All rights reserved.
// YesBill -- Daily Billing Tracker | Created by Ishan Chakraborty

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { configAPI } from '../services/api'
import authService from '../services/authService'
import EnhancedSelect from '../components/ui/enhanced-select'

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "AUD", label: "AUD - Australian Dollar" },
]

export default function Settings() {
  const navigate = useNavigate()
  const [config, setConfig] = useState(null)
  const [dailyAmount, setDailyAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const response = await configAPI.get()
      setConfig(response.data)
      setDailyAmount(response.data.daily_amount.toString())
      setCurrency(response.data.currency)
    } catch (error) {
      console.error('Failed to load config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      await configAPI.update(config.id, {
        daily_amount: parseFloat(dailyAmount),
        currency,
      })
      setMessage('Settings saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authService.signOut();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      // Force navigate even if signOut fails
      navigate('/login', { replace: true });
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">Settings</h1>
          <p className="text-gray-600">Manage your billing configuration</p>
        </motion.div>

        {/* Settings Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-8 mb-6"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Billing Configuration</h2>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Daily Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="999999.99"
                value={dailyAmount}
                onChange={(e) => setDailyAmount(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <p className="mt-2 text-sm text-gray-500">
                Amount charged per YES day
              </p>
            </div>

            <EnhancedSelect
              label="Currency"
              options={CURRENCY_OPTIONS}
              value={currency}
              onChange={setCurrency}
            />

            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-lg text-sm ${
                  message.includes('success')
                    ? 'bg-green-50 border border-green-200 text-green-600'
                    : 'bg-red-50 border border-red-200 text-red-600'
                }`}
              >
                {message}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={saving}
              whileHover={{ scale: saving ? 1 : 1.02 }}
              whileTap={{ scale: saving ? 1 : 0.98 }}
              className="w-full py-3 bg-primary text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>
          </form>
        </motion.div>

        {/* Account Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          <h2 className="text-xl font-bold text-gray-900 mb-6">Account</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200">
              <div>
                <p className="font-medium text-gray-900">Start Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(config?.start_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Status</p>
                <p className="text-sm text-gray-600">
                  {config?.active ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-6 w-full py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-all"
          >
            Logout
          </button>
        </motion.div>
      </div>
    </div>
  )
}
