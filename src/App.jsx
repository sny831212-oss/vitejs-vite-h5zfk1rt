import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Camera, QrCode, MapPin, LogIn, LogOut, Lock, CheckCircle, List, X, Truck, AlertTriangle, Menu, Search, Printer, ChevronRight, ChevronDown, Edit, Image as ImageIcon, ArrowLeft, Archive, Building, Trash2, Move, Upload, Home, Calendar, DollarSign, ExternalLink, CheckSquare, ArrowRightCircle, Plus, FileText, Grid, LayoutGrid, Maximize, Tag, Save, Copy, Layers, RotateCcw, Flashlight, Gamepad2, History } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner'; // 🚀 新增真實相機套件

const INITIAL_INVENTORY_DATA = [];

const ConfirmModal = ({ isOpen, title = "確認", message, onConfirm, onCancel, confirmText = "確定", confirmColor = "bg-red-600" }) => {
  if (!isOpen) return null;
  return (
    <div className="absolute inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full border border-gray-700 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-yellow-500" size={24} />
          <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 pt-2">
          <button onClick={onCancel} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition-all">取消</button>
          <button onClick={onConfirm} className={`flex-1 py-3 ${confirmColor} hover:opacity-90 text-white font-medium rounded-xl transition-all shadow-lg`}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY_DATA);
  const [trashBin, setTrashBin] = useState([]); 
  const [actionLogs, setActionLogs] = useState([]); 
  const [currentTab, setCurrentTab] = useState('hud'); 
  const [currentLocation, setCurrentLocation] = useState(null); 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false); 
  const [isFlashlightOn, setIsFlashlightOn] = useState(false); 

  // 🚀 新增相機狀態
  const [isCameraActive, setIsCameraActive] = useState(false);

  const [modalState, setModalState] = useState(null); 
  const [viewMode, setViewMode] = useState('grid'); 
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('全部');
  const [searchKeyword, setSearchKeyword] = useState('');

  const logAction = (action, target, detail = '') => {
    const newLog = {
      id: Date.now(),
      time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      action,
      target,
      detail
    };
    setActionLogs(prev => [newLog, ...prev.slice(0, 99)]); 
  };

  const handleCreateLocation = (locName) => {
    if (!locName.trim()) return;
    const newLoc = { id: 'loc_' + Date.now(), name: locName, children: [] };
    setInventory(prev => [...prev, newLoc]);
    setCurrentLocation(newLoc);
    logAction('建立空間', locName);
    setModalState(null);
  };

  // 🚀 真實相機掃描後的處理邏輯
  const handleRealScan = (scannedText) => {
    if (!currentLocation) {
      alert("請先在畫面下方選擇或建立目前所在的空間！");
      setIsCameraActive(false);
      return;
    }
    
    // 防呆：避免連續重複掃描同一個條碼
    const isAlreadyInLoc = currentLocation.children.some(item => item.id === scannedText);
    if (isAlreadyInLoc) {
      alert("⚠️ 錯誤：此物品已經在這個空間內！");
      setIsCameraActive(false);
      return;
    }

    const newItem = {
      id: scannedText,
      name: '掃描新增物品',
      category: '未分類',
      note: '由現場真實鏡頭掃描入庫',
      photo: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random()*100000)}?w=300`, // 暫用隨機圖
      scannedAt: new Date().toLocaleString()
    };

    setInventory(prev => prev.map(loc => {
      if (loc.id === currentLocation.id) {
        return { ...loc, children: [newItem, ...loc.children] };
      }
      return loc;
    }));

    logAction('相機盲掃入庫', `條碼: ${scannedText}`, `至 ${currentLocation.name}`);
    setIsCameraActive(false); // 掃到就自動關閉相機
    alert(`✅ 成功掃描入庫！條碼: ${scannedText}`);
  };

  const handleMoveToTrash = (item, locId) => {
    setInventory(prev => prev.map(loc => {
      if (loc.id === locId) return { ...loc, children: loc.children.filter(i => i.id !== item.id) };
      return loc;
    }));
    setTrashBin(prev => [{ ...item, originalLocId: locId }, ...prev]);
    logAction('註銷物品', item.id, '移至近期註銷區');
    setModalState(null);
  };

  const handleRestoreFromTrash = (item) => {
    setTrashBin(prev => prev.filter(i => i.id !== item.id));
    setInventory(prev => prev.map(loc => {
      if (loc.id === item.originalLocId) return { ...loc, children: [item, ...loc.children] };
      return loc;
    }));
    logAction('還原物品', item.id, `回歸原空間`);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-sans select-none overflow-hidden">
      
      {/* ================= 右側：APP 本體 ================= */}
      <div className="flex-1 flex justify-center items-center bg-gray-950 p-0 sm:p-4">
        <div className="w-full max-w-[430px] h-full sm:h-[880px] bg-gray-900 sm:rounded-[48px] sm:border-[8px] sm:border-gray-800 shadow-2xl flex flex-col relative overflow-hidden">

          {/* 頂部導航列 */}
          <div className="bg-gray-900/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between z-20">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-800 rounded-xl text-gray-300">
                <Menu size={22} />
              </button>
              <div>
                <h1 className="font-bold text-white text-base leading-none">倉儲防呆 WMS</h1>
                <p className="text-[10px] text-cyan-400 mt-1">
                  {currentLocation ? `📍 鎖定: ${currentLocation.name}` : '⚠️ 尚未鎖定倉庫'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setIsLogDrawerOpen(true)} className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl relative">
                <History size={18} />
                {actionLogs.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-cyan-400 rounded-full"></span>}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto relative pb-24">
            
            {/* TAB 1: 掃描指揮官 (真實相機版) */}
            {currentTab === 'hud' && (
              <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] text-center space-y-6">
                
                {isCameraActive ? (
                  <div className="w-full max-w-[320px] rounded-3xl overflow-hidden border-2 border-cyan-500 shadow-[0_0_20px_#22d3ee40] relative z-10">
                    <div className="absolute top-2 right-2 z-50">
                      <button onClick={() => setIsCameraActive(false)} className="p-2 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg">
                        <X size={20} />
                      </button>
                    </div>
                    {/* 這裡呼叫套件開啟真實鏡頭 */}
                    <Scanner 
                      onScan={(result) => {
                        if (result && result.length > 0) {
                          handleRealScan(result[0].rawValue);
                        }
                      }}
                      formats={['qr_code', 'code_128', 'ean_13']}
                      styles={{ container: { width: '100%', aspectRatio: '3/4' } }}
                    />
                    <div className="absolute bottom-4 inset-x-0 flex justify-center z-50">
                      <span className="bg-black/70 px-4 py-1.5 rounded-full text-xs text-white">請將條碼對準鏡頭...</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[3/4] max-w-[320px] bg-black/60 rounded-3xl border-2 border-dashed border-gray-700 relative overflow-hidden flex flex-col items-center justify-center shadow-2xl z-10">
                    <Camera size={56} className="text-gray-600 mb-4" />
                    <p className="text-sm font-medium text-gray-400">鏡頭目前處於休眠狀態</p>
                    <button 
                      onClick={() => setIsCameraActive(true)} 
                      className="mt-6 px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-900/50"
                    >
                      <QrCode size={18} /> 啟動相機掃描
                    </button>
                  </div>
                )}

                {/* 空間切換按鈕 */}
                <div className="w-full max-w-[320px] bg-gray-800/80 backdrop-blur p-4 rounded-2xl border border-gray-700 text-left space-y-2 z-10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">目前作業倉庫</span>
                    <button onClick={() => setModalState({ type: 'createLoc' })} className="text-xs text-cyan-400 hover:underline">＋ 建立新空間</button>
                  </div>
                  <button 
                    onClick={() => setModalState({ type: 'selectLoc' })}
                    className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-700 border border-gray-700 rounded-xl flex items-center justify-between text-white font-bold transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={18} className="text-cyan-400" />
                      {currentLocation ? currentLocation.name : '點此選擇目前所在空間 ➔'}
                    </span>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: 庫存總覽 */}
            {currentTab === 'inventory' && (
              <div className="p-4 space-y-4">
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-800">
                  <span className="text-xs font-bold text-gray-400 flex items-center">空間:</span>
                  {inventory.map(loc => (
                    <button 
                      key={loc.id}
                      onClick={() => setCurrentLocation(loc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${currentLocation?.id === loc.id ? 'bg-cyan-600 text-white shadow-md' : 'bg-gray-800 text-gray-400'}`}
                    >
                      {loc.name} ({loc.children.length})
                    </button>
                  ))}
                  <button 
                    onClick={() => setCurrentLocation({ id: 'trash_view', name: '近期註銷區' })}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${currentLocation?.id === 'trash_view' ? 'bg-red-600 text-white' : 'bg-gray-800 text-red-400'}`}
                  >
                    <Trash2 size={12} /> 註銷 ({trashBin.length})
                  </button>
                </div>

                {currentLocation?.id === 'trash_view' ? (
                  <div className="space-y-3">
                    {trashBin.length === 0 ? <div className="text-center py-12 text-gray-600 text-sm">近期註銷區是空的</div> : 
                      trashBin.map(item => (
                        <div key={item.id} className="bg-gray-900 border border-red-900/50 p-3 rounded-2xl flex justify-between">
                          <div>
                            <h4 className="font-bold text-white text-sm">已註銷條碼: {item.id}</h4>
                          </div>
                          <button onClick={() => handleRestoreFromTrash(item)} className="px-3 py-1 bg-gray-800 text-cyan-400 rounded-xl text-xs">還原</button>
                        </div>
                      ))
                    }
                  </div>
                ) : !currentLocation ? (
                  <div className="text-center py-16 text-gray-500 text-sm">請選擇上方空間以檢視物品，或建立新空間</div>
                ) : (
                  <div className="space-y-3">
                    {currentLocation.children.length === 0 ? <div className="text-center py-16 text-gray-600 text-sm">空無一物，快去掃描幾樣進來吧！</div> : 
                      <div className="grid grid-cols-2 gap-3">
                        {currentLocation.children.map(item => (
                          <div key={item.id} onClick={() => setModalState({ type: 'detail', data: { item, locId: currentLocation.id } })} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden cursor-pointer">
                            <img src={item.photo} alt="" className="w-full aspect-square object-cover" />
                            <div className="p-3">
                              <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                              <p className="text-[11px] text-cyan-400 font-mono truncate">{item.id}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    }
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 列印中心 */}
            {currentTab === 'print' && (
              <div className="p-4 space-y-4">
                <div className="bg-gray-900 p-4 rounded-2xl border border-gray-800">
                  <h3 className="font-bold text-white text-sm">測試用 QR Code 產生器</h3>
                  <p className="text-xs text-gray-400 mt-1">目前因為沒有資料，我們先隨機產生幾個供您測試掃描：</p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {['TEST-001', 'BOX-8899', 'DEVICE-X'].map(code => (
                      <div key={code} className="bg-gray-950 p-3 rounded-xl border border-gray-800 flex flex-col items-center">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${code}`} alt="QR" className="w-24 h-24 bg-white p-1 rounded-lg mb-2" />
                        <span className="text-[10px] text-cyan-400 font-mono">{code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 底部導航欄 */}
          <div className="absolute bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur border-t border-gray-800 py-2 px-6 flex justify-around items-center z-20">
            <button onClick={() => setCurrentTab('hud')} className={`flex flex-col items-center gap-1 ${currentTab === 'hud' ? 'text-cyan-400' : 'text-gray-500'}`}><Camera size={20} /><span className="text-[10px]">掃描 HUD</span></button>
            <button onClick={() => setCurrentTab('inventory')} className={`flex flex-col items-center gap-1 ${currentTab === 'inventory' ? 'text-cyan-400' : 'text-gray-500'}`}><Archive size={20} /><span className="text-[10px]">庫存總覽</span></button>
            <button onClick={() => setCurrentTab('print')} className={`flex flex-col items-center gap-1 ${currentTab === 'print' ? 'text-cyan-400' : 'text-gray-500'}`}><Printer size={20} /><span className="text-[10px]">標籤測試</span></button>
          </div>

          {/* 側邊欄與彈窗 (簡化以符合長度) */}
          {isLogDrawerOpen && (
            <div className="absolute inset-0 z-50 bg-black/60 flex justify-end">
              <div className="w-80 h-full bg-gray-900 p-4 border-l border-gray-800"><button onClick={() => setIsLogDrawerOpen(false)} className="text-gray-400 float-right"><X size={18} /></button><h3 className="text-white font-bold mb-4">流水日誌</h3>
                {actionLogs.map(log => <div key={log.id} className="text-xs text-gray-400 border-b border-gray-800 py-2">{log.time} - {log.action}: {log.target}</div>)}
              </div>
            </div>
          )}

          {modalState?.type === 'createLoc' && (
             <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
             <div className="bg-gray-900 rounded-3xl p-6 w-full border border-gray-700 shadow-2xl">
               <h3 className="text-white font-bold mb-4">建立新倉庫</h3>
               <input id="locInp" placeholder="例如：1F 暫存區" className="w-full bg-gray-950 border border-gray-700 rounded-xl px-3 py-2 text-white mb-4" />
               <div className="flex gap-2">
                 <button onClick={() => setModalState(null)} className="flex-1 py-2 bg-gray-800 text-white rounded-xl">取消</button>
                 <button onClick={() => handleCreateLocation(document.getElementById('locInp').value)} className="flex-1 py-2 bg-cyan-600 text-white rounded-xl">建立</button>
               </div>
             </div>
           </div>
          )}

          {modalState?.type === 'selectLoc' && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-3xl p-6 w-full border border-gray-700 shadow-2xl">
                <h3 className="text-white font-bold mb-4">選擇空間</h3>
                <div className="space-y-2 mb-4">
                  {inventory.map(loc => (
                    <button key={loc.id} onClick={() => { setCurrentLocation(loc); setModalState(null); }} className="w-full text-left p-3 rounded-xl bg-gray-950 text-white">{loc.name}</button>
                  ))}
                </div>
                <button onClick={() => setModalState(null)} className="w-full py-2 bg-gray-800 text-white rounded-xl">關閉</button>
              </div>
            </div>
          )}

          {modalState?.type === 'detail' && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
              <div className="bg-gray-900 rounded-3xl p-6 w-full border border-gray-700">
                <h3 className="text-white font-bold mb-2">物品資料</h3>
                <p className="text-cyan-400 font-mono text-sm mb-4">ID: {modalState.data.item.id}</p>
                <div className="flex gap-2">
                  <button onClick={() => handleMoveToTrash(modalState.data.item, modalState.data.locId)} className="flex-1 py-2 bg-red-600/30 text-red-400 rounded-xl">註銷物品</button>
                  <button onClick={() => setModalState(null)} className="flex-1 py-2 bg-gray-800 text-white rounded-xl">關閉</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}