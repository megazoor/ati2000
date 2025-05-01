'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { formatDistanceToNow } from 'date-fns'
import dynamic from 'next/dynamic'

// Dynamically import Highcharts components with no SSR
const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false })
const Highcharts = dynamic(() => import('highcharts'), { ssr: false })

interface Position {
  ticker: string
  entryPrice: number
  stopLoss: number
  takeProfit: number
  size: number
  entryTime: string
}

interface StatusData {
  enabled: boolean
  tradingAllowed: boolean
  uptime: string
  lastTradeTime: string
  recentTrades: any[]
  currentPosition: Position | null
  version: string
  serverTime: string
}

export default function Dashboard() {
  const [status, setStatus] = useState<StatusData | null>(null)
  const [metrics, setMetrics] = useState<any | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      // In a production environment, use actual API endpoints
      // For demo purposes, we're creating mock data
      
      // Simulated status data
      const statusData: StatusData = {
        enabled: true,
        tradingAllowed: true,
        uptime: '2d 5h 32m 10s',
        lastTradeTime: new Date().toISOString(),
        recentTrades: [
          {
            ticker: 'BTC-USD',
            action: 'BUY',
            price: 95600,
            size: 0.01,
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
          },
          {
            ticker: 'ETH-USD',
            action: 'SELL',
            price: 3250,
            size: 0.1,
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
          }
        ],
        currentPosition: {
          ticker: 'BTC-USD',
          entryPrice: 95600,
          stopLoss: 94500,
          takeProfit: 98800,
          size: 0.01,
          entryTime: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        version: '1.0.0',
        serverTime: new Date().toISOString()
      }
      
      setStatus(statusData)
      
      // Simulated metrics data
      const metricsData = {
        totalTrades: 24,
        completedTrades: 20,
        winTrades: 15,
        lossTrades: 5,
        winRate: 0.75,
        totalProfit: 1235.50,
        config: {
          enabled: true,
          stopLossATR: 0.8,
          takeProfitATR: 3.2
        }
      }
      
      setMetrics(metricsData)
      
      /* In production, use real API endpoints:
      const statusResponse = await axios.get('/api/status', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStatus(statusResponse.data)
      
      const metricsResponse = await axios.get('/api/trade/metrics', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMetrics(metricsResponse.data)
      */
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Prepare chart options
  const getChartOptions = () => {
    return {
      title: {
        text: 'Trading Performance'
      },
      chart: {
        type: 'column',
        backgroundColor: 'transparent'
      },
      xAxis: {
        categories: ['Total Trades', 'Completed', 'Wins', 'Losses']
      },
      yAxis: {
        title: {
          text: 'Count'
        }
      },
      series: [{
        name: 'Trades',
        data: metrics ? [
          metrics.totalTrades,
          metrics.completedTrades,
          metrics.winTrades,
          metrics.lossTrades
        ] : [0, 0, 0, 0],
        color: '#0ea5e9'
      }],
      credits: {
        enabled: false
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-6">Trading Dashboard</h1>
      
      {error && (
        <div className="bg-danger-100 dark:bg-danger-700/20 text-danger-700 dark:text-danger-300 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Bot Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Bot Status</h3>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${status?.enabled ? 'bg-success-500' : 'bg-danger-500'}`}></div>
            <p className="text-lg font-semibold">{status?.enabled ? 'Online' : 'Offline'}</p>
          </div>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
            Uptime: {status?.uptime || 'N/A'}
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Trading Status</h3>
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${status?.tradingAllowed ? 'bg-success-500' : 'bg-warning-500'}`}></div>
            <p className="text-lg font-semibold">{status?.tradingAllowed ? 'Active' : 'Paused'}</p>
          </div>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
            Last trade: {status?.lastTradeTime ? formatDistanceToNow(new Date(status.lastTradeTime), { addSuffix: true }) : 'N/A'}
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Win Rate</h3>
          <p className="text-lg font-semibold">
            {metrics?.winRate ? `${(metrics.winRate * 100).toFixed(1)}%` : 'N/A'}
          </p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
            {metrics?.winTrades || 0} wins / {metrics?.lossTrades || 0} losses
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Total Trades</h3>
          <p className="text-lg font-semibold">{metrics?.totalTrades || 0}</p>
          <p className="text-xs text-secondary-600 dark:text-secondary-400 mt-2">
            {metrics?.completedTrades || 0} completed
          </p>
        </div>
      </div>
      
      {/* Current Position */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Position</h2>
        {status?.currentPosition ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Asset</h3>
              <p className="text-lg font-semibold">{status.currentPosition.ticker}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Entry Price</h3>
              <p className="text-lg font-semibold">${status.currentPosition.entryPrice.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Stop Loss</h3>
              <p className="text-lg font-semibold text-danger-500">${status.currentPosition.stopLoss.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Take Profit</h3>
              <p className="text-lg font-semibold text-success-500">${status.currentPosition.takeProfit.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">Size</h3>
              <p className="text-lg font-semibold">{status.currentPosition.size} BTC</p>
            </div>
          </div>
        ) : (
          <p className="text-secondary-600 dark:text-secondary-400">No active position</p>
        )}
      </div>
      
      {/* Performance Chart */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="h-64">
          {Highcharts && (
            <HighchartsReact
              highcharts={Highcharts}
              options={getChartOptions()}
              containerProps={{ style: { height: '100%' } }}
            />
          )}
        </div>
      </div>
      
      {/* Recent Trades */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Trades</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">Asset</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {status?.recentTrades && status.recentTrades.length > 0 ? (
                status.recentTrades.map((trade, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {formatDistanceToNow(new Date(trade.timestamp), { addSuffix: true })}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{trade.ticker}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        trade.action === 'BUY' 
                          ? 'bg-success-100 text-success-700 dark:bg-success-700/20 dark:text-success-300' 
                          : 'bg-danger-100 text-danger-700 dark:bg-danger-700/20 dark:text-danger-300'
                      }`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">${trade.price.toLocaleString()}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">{trade.size}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-3 text-sm text-center text-secondary-600 dark:text-secondary-400">
                    No recent trades
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}