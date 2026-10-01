import React from 'react'
import type { ViewportMode } from '../../types'

interface DeviceFrameProps {
  viewportMode: ViewportMode
  onSetViewportMode: (mode: ViewportMode) => void
  children: React.ReactNode
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({
  viewportMode,
  onSetViewportMode: _onSetViewportMode,
  children,
}) => {
  if (viewportMode === 'desktop') {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    )
  }

  const maxWidthClass =
    viewportMode === 'mobile' ? 'max-w-[412px]' : 'max-w-[768px]'

  return (
    <div className="flex justify-center w-full py-2 sm:py-4 px-2 sm:px-4">
      <div
        className={`w-full ${maxWidthClass} transition-all duration-300 relative bg-[#F8FAFC] rounded-[40px] shadow-2xl border-[10px] border-slate-900 overflow-hidden flex flex-col min-h-[780px] max-h-[92vh]`}
      >
        {/* Smartphone Speaker / Notch Bar */}
        <div className="w-full h-7 bg-slate-900 flex items-center justify-center shrink-0">
          <div className="w-24 h-4 bg-black rounded-b-xl flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
            <div className="w-10 h-1 bg-slate-800 rounded-full" />
          </div>
        </div>

        {/* Device Content Scroll Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar relative p-3.5 sm:p-4">
          {children}
        </div>

        {/* Smartphone Home Indicator Bar */}
        <div className="w-full h-5 bg-slate-900 flex items-center justify-center shrink-0">
          <div className="w-32 h-1 bg-slate-700 rounded-full" />
        </div>
      </div>
    </div>
  )
}
