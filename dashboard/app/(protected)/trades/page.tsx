'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import dynamic from 'next/dynamic'

// Dynamically import Highcharts components with no SSR
const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false })
const Highcharts = dynamic(() => import('highcharts'), { ssr: false })

interface Trade {
  ticker: string
  action: string
  price: number
  size: number
  stopLoss?: number
  takeProfit?: number
  orderId: string
  confidence?: number
  timestamp: string
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all') // all, buy, sell
  const [sortBy, setSortBy] = useState('date') // date, ticker, price
  const [sortDir, setSortDir] = useState('desc') // asc, desc

  const fetchTrades = async () => {
    try {
      setIsLoading(true)
      setError('')
      
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        throw new Error('Not authenticated')
      }
      
      // In a production environment, use actual API endpoints
      // For demo purposes, we're creating mock data
      const mockTrades: Trade[] = [
        {
          ticker: 'BTC-USD',
          action: 'BUY',
          price: 95600,
          size: 0.01,
          stopLoss: 94500,
          takeProfit: 98800,
          orderId: '12345abc',
          confidence: 0.92,
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 minutes ago
        },
        {
          ticker: 'ETH-USD',
          action: 'SELL',
          price: 3250,
          size: 0.1,
          orderId: '23456def',
          confidence: 0.85,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() // 2 hours ago
        },
        {
          ticker: 'BTC-USD',
          action: 'SELL',
          price: 96100,
          size: 0.01,
          orderId: '34567ghi',
          confidence: 0.78,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
        },
        {
          ticker: 'ETH-USD',
          action: 'BUY',
          price: 3150,
          size: 0.1,
          stopLoss: 3050,
          takeProfit: 3350,
          orderId: '45678jkl',
          confidence: 0.89,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() // 6 hours ago
        },
        {
          ticker: 'BTC-USD',
          action: 'BUY',
          price: 94500,
          size: 0.01,
          stopLoss: 93400,
          takeProfit: 97700,
          orderId: '56789mno',
          confidence: 0.95,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() // 1 day ago
        }
      ]
      
      setTrades(mockTrades)
      
      /* In production, use real API endpoints:
      const response = await axios.get('/api/trade/history?limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setTrades(response.data.trades)
      */
    } catch (err) {
      console.error('Error fetching trades:', err)
      setError('Failed to load trade history')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades()
  }, [])

  // Filter trades based on selected filter
  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true
    if (filter === 'buy') return trade.action === 'BUY'
    if (filter === 'sell') return trade.action === 'SELL'
    return true
  })

  // Sort trades based on selected sort options
  const sortedTrades = [...filteredTrades].sort((a, b) => {
    const multiplier = sortDir === 'asc' ? 1 : -1
    
    if (sortBy === 'date') {
      return multiplier * (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }
    
    if (sortBy === 'ticker') {
      return multiplier * a.ticker.localeCompare(b.ticker)
    }
    
    if (sortBy === 'price') {
      return multiplier * (a.price - b.price)
    }
    
    return 0
  })

  // Prepare chart options
  const getChartOptions = () => {
    // Group trades by date
    const tradesByDate = trades.reduce((acc, trade) => {
      const date = format(new Date(trade.timestamp), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = { buys: 0, sells: 0 }
      }
      
      if (trade.action === 'BUY') {
        acc[date].buys += 1
      } else {
        acc[date].sells += 1
      }
      
      return acc
    }, {} as Record<string, { buys: number, sells: number }>)
    
    // Sort dates
    const dates = Object.keys(tradesByDate).sort()
    
    return {
      title: {
        text: 'Trading Activity'
      },
      chart: {
        type: 'column',
        backgroundColor: 'transparent'
      },
      xAxis: {
        categories: dates,
        crosshair: true
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Number of Trades'
        }
      },
      tooltip: {
        headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
        pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
          '<td style="padding:0"><b>{point.y}</b></td></tr>',
        footerFormat: '</table>',
        shared: true,
        useHTML: true
      },
      plotOptions: {
        column: {
          pointPadding: 0.2,
          borderWidth: 0
        }
      },
      series: [{
        name: 'Buy Orders',
        data: dates.map(date => tradesByDate[date].buys),
        color: '#22c55e' // Green
      }, {
        name: 'Sell Orders',
        data: dates.map(date => tradesByDate[date].sells),
        color: '#ef4444' // Red
      }],
      credits: {
        enabled: false
      }
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle direction if clicking the same column
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new column and default to descending
      setSortBy(column)
      setSortDir('desc')
    }
  }

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null
    
    return (
      <span className="ml-1">
        {sortDir === 'asc' ? '↑' : '↓'}
      </span>
    )
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
      <h1 className="text-2xl font-bold mb-6">Trade History</h1>
      
      {error && (
        <div className="bg-danger-100 dark:bg-danger-700/20 text-danger-700 dark:text-danger-300 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {/* Trade Analytics */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Trade Analytics</h2>
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
      
      {/* Trade Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <label htmlFor="filter" className="block text-sm font-medium text-secondary-600 dark:text-secondary-400 mb-1">
            Filter
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700"
          >
            <option value="all">All Trades</option>
            <option value="buy">Buy Orders</option>
            <option value="sell">Sell Orders</option>
          </select>
        </div>
        
        <div className="ml-auto">
          <button
            onClick={fetchTrades}
            className="btn btn-secondary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>
      
      {/* Trade Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-secondary-200 dark:divide-secondary-700">
            <thead>
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Date/Time {renderSortIcon('date')}
                  </div>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center">
                    Asset {renderSortIcon('ticker')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                  Action
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    Price {renderSortIcon('price')}
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                  Stop Loss
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 dark:text-secondary-400 uppercase tracking-wider">
                  Take Profit
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
              {sortedTrades.length > 0 ? (
                sortedTrades.map((trade, index) => (
                  <tr key={index} className="hover:bg-secondary-50 dark:hover:bg-secondary-800/50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {trade.ticker}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        trade.action === 'BUY' 
                          ? 'bg-success-100 text-success-700 dark:bg-success-700/20 dark:text-success-300' 
                          : 'bg-danger-100 text-danger-700 dark:bg-danger-700/20 dark:text-danger-300'
                      }`}>
                        {trade.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      ${trade.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {trade.size}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      {trade.confidence ? (trade.confidence * 100).toFixed(1) + '%' : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-danger-500">
                      {trade.stopLoss ? '$' + trade.stopLoss.toLocaleString() : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-success-500">
                      {trade.takeProfit ? '$' + trade.takeProfit.toLocaleString() : '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-sm text-center text-secondary-600 dark:text-secondary-400">
                    No trades found
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