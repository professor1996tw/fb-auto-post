'use client'

import Image from 'next/image'
import { FacebookPage } from '@/lib/types'

interface PageCardProps {
  page: FacebookPage
  isSelected: boolean
  onToggle: (pageId: string) => void
}

/**
 * 粉專卡片元件
 * 顯示粉專頭像、名稱、粉絲數，支援點擊選取
 */
export function PageCard({ page, isSelected, onToggle }: PageCardProps) {
  const pictureUrl = page.picture?.data?.url

  return (
    <div
      onClick={() => onToggle(page.id)}
      className={`page-card ${isSelected ? 'selected' : ''}`}
    >
      <div className="flex items-center gap-3">
        {/* 粉專頭像 */}
        <div className="relative flex-shrink-0">
          {pictureUrl ? (
            <img
              src={pictureUrl}
              alt={page.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
              📄
            </div>
          )}

          {/* 選取勾勾 */}
          {isSelected && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full
                            flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>

        {/* 粉專資訊 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{page.name}</h3>
          {page.category && (
            <p className="text-xs text-gray-400 mt-0.5">{page.category}</p>
          )}
          {page.fan_count !== undefined && (
            <p className="text-sm text-gray-500 mt-1">
              👥 {page.fan_count.toLocaleString()} 粉絲
            </p>
          )}
        </div>

        {/* 選取指示 */}
        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors
                        ${isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300'}`}>
        </div>
      </div>
    </div>
  )
}
