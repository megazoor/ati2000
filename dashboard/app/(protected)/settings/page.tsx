'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface StrategyConfig {
  enabled: boolean
  stopLossATR: number
  takeProfitATR: number
  useVwapFilter: boolean
  useMacdFilter: boolean
  tradingHoursOnly: boolean
  tradingStartHour: number
  tradingEndHour: number
  maxTradesPerDay: number
  minimumConfidence: number
  whitelistedSymbols: string[]
}

export default function SettingsPage() {
  const [config, setConfig] = useState<StrategyConfig>({
    enabled: true,
    stopLossATR: 0.8,
    takeProfitATR: 3.2,
    useVwapFilter: false,
    useMacdFilter: false,
    tradingHoursOnly: false,
    tradingStartHour: 9,
    tradingEndHour: 16,
    maxTradesPerDay: 5,
    minimumConfidence: 0.7,
    whitelistedSymbols: ['BTC-USD', 'ETH-USD']
  })
  
  const [newSymbol, setNewSymbol] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      // In a production environment, use actual API endpoints
      // For demo purposes, we're using mock data
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock data is already set in the initial state
      
      /* In production, use real API endpoints:
      const response = await axios.get('/api/trade/config', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setConfig(response.data.config)
      */
      
      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching config:', err)
      setError('Failed to load configuration')
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccessMessage('')
      
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      // In a production environment, use actual API endpoints
      // For demo purposes, we're simulating a successful save
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      /* In production, use real API endpoints:
      await axios.put('/api/trade/config', config, {
        headers: { Authorization: `Bearer ${token}` }
      })
      */
      
      setSuccessMessage('Configuration saved successfully')
      setIsLoading(false)
    } catch (err) {
      console.error('Error saving config:', err)
      setError('Failed to save configuration')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target
    
    setConfig(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddSymbol = () => {
    if (!newSymbol || config.whitelistedSymbols.includes(newSymbol)) {
      return
    }
    
    setConfig(prev => ({
      ...prev,
      whitelistedSymbols: [...prev.whitelistedSymbols, newSymbol]
    }))
    
    setNewSymbol('')
  }

  const handleRemoveSymbol = (symbol: string) => {
    setConfig(prev => ({
      ...prev,
      whitelistedSymbols: prev.whitelistedSymbols.filter(s => s !== symbol)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveConfig()
  }

  if (isLoading && !config) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Strategy Settings</h1>
      
      {error && (
        <div className="bg-danger-100 dark:bg-danger-700/20 text-danger-700 dark:text-danger-300 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-success-100 dark:bg-success-700/20 text-success-700 dark:text-success-300 p-4 rounded-md mb-6">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Trading Status */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Trading Status</h2>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={config.enabled}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <span className="ml-2 text-sm">Enable Automated Trading</span>
              </label>
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                When disabled, no trades will be executed automatically
              </p>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="tradingHoursOnly"
                  checked={config.tradingHoursOnly}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <span className="ml-2 text-sm">Limit Trading to Specific Hours</span>
              </label>
            </div>
            
            {config.tradingHoursOnly && (
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="tradingStartHour" className="block text-sm font-medium mb-1">
                    Start Hour (24h)
                  </label>
                  <input
                    type="number"
                    id="tradingStartHour"
                    name="tradingStartHour"
                    min="0"
                    max="23"
                    value={config.tradingStartHour}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
                  />
                </div>
                <div>
                  <label htmlFor="tradingEndHour" className="block text-sm font-medium mb-1">
                    End Hour (24h)
                  </label>
                  <input
                    type="number"
                    id="tradingEndHour"
                    name="tradingEndHour"
                    min="0"
                    max="23"
                    value={config.tradingEndHour}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
                  />
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="maxTradesPerDay" className="block text-sm font-medium mb-1">
                Maximum Trades Per Day
              </label>
              <input
                type="number"
                id="maxTradesPerDay"
                name="maxTradesPerDay"
                min="0"
                value={config.maxTradesPerDay}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
              />
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                Set to 0 for unlimited trades
              </p>
            </div>
          </div>
          
          {/* Risk Management */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Risk Management</h2>
            
            <div className="mb-4">
              <label htmlFor="stopLossATR" className="block text-sm font-medium mb-1">
                Stop Loss (ATR Multiplier)
              </label>
              <input
                type="number"
                id="stopLossATR"
                name="stopLossATR"
                step="0.1"
                min="0.1"
                value={config.stopLossATR}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
              />
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                Example: 0.8 × ATR will set stop loss at 0.8 times the Average True Range below the entry price
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="takeProfitATR" className="block text-sm font-medium mb-1">
                Take Profit (ATR Multiplier)
              </label>
              <input
                type="number"
                id="takeProfitATR"
                name="takeProfitATR"
                step="0.1"
                min="0.1"
                value={config.takeProfitATR}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
              />
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                Example: 3.2 × ATR will set take profit at 3.2 times the Average True Range above the entry price
              </p>
            </div>
            
            <div>
              <label htmlFor="minimumConfidence" className="block text-sm font-medium mb-1">
                Minimum Signal Confidence (0-1)
              </label>
              <input
                type="number"
                id="minimumConfidence"
                name="minimumConfidence"
                step="0.05"
                min="0"
                max="1"
                value={config.minimumConfidence}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
              />
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                Signals with confidence below this threshold will be ignored
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Filter Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Filter Settings</h2>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="useVwapFilter"
                  checked={config.useVwapFilter}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <span className="ml-2 text-sm">Use VWAP Filter</span>
              </label>
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                Only allow buy signals when price is below VWAP, and sell signals when price is above VWAP
              </p>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="useMacdFilter"
                  checked={config.useMacdFilter}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded"
                />
                <span className="ml-2 text-sm">Use MACD Filter</span>
              </label>
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                Only allow buy signals when MACD is positive, and sell signals when MACD is negative
              </p>
            </div>
          </div>
          
          {/* Whitelist Settings */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Whitelist Settings</h2>
            
            <div className="mb-4">
              <label htmlFor="newSymbol" className="block text-sm font-medium mb-1">
                Add Symbol
              </label>
              <div className="flex">
                <input
                  type="text"
                  id="newSymbol"
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value)}
                  placeholder="e.g. BTC-USD"
                  className="flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
                />
                <button
                  type="button"
                  onClick={handleAddSymbol}
                  className="btn btn-primary rounded-l-none"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-secondary-600 dark:text-secondary-400">
                Only signals for whitelisted symbols will be processed
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Whitelisted Symbols
              </label>
              <div className="max-h-40 overflow-y-auto border border-secondary-300 dark:border-secondary-600 rounded-md p-2 bg-white dark:bg-secondary-700">
                {config.whitelistedSymbols.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {config.whitelistedSymbols.map((symbol, index) => (
                      <div
                        key={index}
                        className="bg-secondary-100 dark:bg-secondary-600 px-2 py-1 rounded-md flex items-center"
                      >
                        <span className="text-sm mr-1">{symbol}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSymbol(symbol)}
                          className="text-secondary-600 dark:text-secondary-300 hover:text-danger-500 dark:hover:text-danger-300"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-secondary-600 dark:text-secondary-400 italic">
                    No symbols whitelisted (all symbols will be allowed)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={fetchConfig}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  )
}