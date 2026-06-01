"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import Image from "next/image";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";

const escrowLabels: Record<string, string> = {
  held: "׳”׳×׳©׳׳•׳ ׳‘׳ ׳׳׳ ׳•׳×",
  released_to_seller: "׳”׳•׳©׳׳",
  refunded_to_buyer: "׳”׳•׳—׳–׳¨",
};

const shippingLabels: Record<string, string> = {
  pending: "׳׳׳×׳™׳",
  shipped: "׳ ׳©׳׳—",
  delivered: "׳”׳’׳™׳¢",
  disputed: "׳‘׳׳—׳׳•׳§׳×",
};

const orderTabs = [
  { id: "all", label: "׳³ג€׳³ג€÷׳³ֲ" },
  { id: "buyer", label: "׳³ֲ§׳³ֲ ׳³ג„¢׳³ג€¢׳³ֳ—" },
  { id: "seller", label: "׳³ֲ׳³ג€÷׳³ג„¢׳³ֲ¨׳³ג€¢׳³ֳ—" },
] as const;

function OrderChat({ orderId, currentUserId }: { orderId: Id<"orders">, currentUserId?: Id<"users"> }) {
  const messages = useQuery(api.orders.getMessages, { orderId });
  const send = useMutation(api.orders.sendMessage);
  const [inputText, setInputText] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    try {
      await send({ orderId, text: inputText });
      setInputText("");
    } catch {
      alert("׳©׳’׳™׳׳” ׳‘׳©׳׳™׳—׳× ׳”׳”׳•׳“׳¢׳”");
    }
  };

  if (messages === undefined) return <div className="p-4 text-center text-[10px] text-stone-400">{"Loading chat..."}</div>;

  return (
    <div className="mt-4 border-t border-stone-100 pt-4">
      <div className="flex items-center gap-2 mb-3 text-stone-600">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
        <span className="text-xs font-bold uppercase tracking-wider">{"Chat"}</span>
      </div>
      <div className="max-h-40 overflow-y-auto space-y-2 flex flex-col mb-3 scrollbar-hide">
        {messages.length === 0 ? (
          <p className="text-center text-[10px] text-stone-400">׳׳™׳ ׳”׳•׳“׳¢׳•׳× ׳¢׳“׳™׳™׳. ׳×׳׳ ׳›׳׳ ׳׳× ׳”׳׳₪׳’׳©!</p>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg._id} 
              className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-xs ${
                msg.sender_id === currentUserId 
                  ? "bg-emerald-800 text-white self-start" 
                  : "bg-stone-100 text-stone-800 self-end"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSend} className="flex gap-2">
        <input 
          type="text" 
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="׳›׳×׳•׳‘ ׳”׳•׳“׳¢׳”..."
          className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 ring-emerald-500"
        />
        <button type="submit" className="bg-emerald-800 text-white p-2 rounded-xl transition-transform active:scale-90">
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
        </button>
      </form>
    </div>
  );
}

export default function OrdersPage() {
  const orders = useQuery(api.orders.getMyOrders);
  const currentUser = useQuery(api.users.getMe);
  const verifyDelivery = useMutation(api.orders.verifyPhysicalDelivery);
  const updateMeetingPoint = useMutation(api.orders.updateMeetingPoint);
  const [activeTab, setActiveTab] = useState<"all" | "buyer" | "seller">("all");
  const [verificationInput, setVerificationInput] = useState<{ [key: string]: string }>({});
  const [meetingPointInput, setMeetingPointInput] = useState<{ [key: string]: string }>({});
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [openChat, setOpenChat] = useState<string | null>(null);

  if (orders === undefined) {
    return <div className="p-10 text-center">׳˜׳•׳¢׳ ׳”׳–׳׳ ׳•׳×...</div>;
  }

  const filteredOrders = orders.filter(o => 
    activeTab === "all" ? true : o.role === activeTab
  ).sort((a, b) => b._creationTime - a._creationTime);

  const handleVerify = async (orderId: Id<"orders">) => {
    const code = verificationInput[orderId];
    if (!code) return;
    
    setIsVerifying(orderId);
    try {
      await verifyDelivery({ orderId, code });
      alert("׳”׳¦׳׳— ׳׳•׳׳× ׳‘׳”׳¦׳׳—׳”! ׳×׳×׳—׳“׳© נ±");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsVerifying(null);
    }
  };

  const handleUpdateMeetingPoint = async (orderId: Id<"orders">) => {
    const meetingPoint = meetingPointInput[orderId];
    if (!meetingPoint) return;
    try {
      await updateMeetingPoint({ orderId, meetingPoint });
    } catch {
      alert("׳©׳’׳™׳׳” ׳‘׳¢׳“׳›׳•׳ ׳”׳׳™׳§׳•׳");
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50" dir="rtl">
      <header className="p-6 bg-white border-b border-stone-100 sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-stone-800">׳”׳”׳–׳׳ ׳•׳× ׳©׳׳™</h1>
        
        <div className="flex mt-6 p-1 bg-stone-100 rounded-2xl">
          {orderTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                activeTab === tab.id 
                  ? "bg-white text-emerald-800 shadow-sm" 
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {filteredOrders.length === 0 ? (
          <EmptyState 
            icon="נ“¦"
            title="׳׳™׳ ׳¢׳“׳™׳™׳ ׳”׳–׳׳ ׳•׳×"
            description="׳›׳׳ ׳™׳•׳₪׳™׳¢׳• ׳”׳¦׳׳—׳™׳ ׳©׳§׳ ׳™׳× ׳׳• ׳׳›׳¨׳× ׳‘׳׳›׳¨׳–׳™׳ ׳•׳‘׳©׳•׳§."
            buttonText="׳׳©׳•׳§ ׳”׳¦׳׳—׳™׳"
            buttonHref="/"
          />
        ) : (
          filteredOrders.map((order) => (
            <div key={order._id} className="bg-white rounded-[24px] p-4 shadow-sm border border-stone-100 flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border border-stone-100 bg-stone-50">
                  {order.imageUrl ? (
                    <Image src={order.imageUrl} alt={order.plantType} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-stone-300 text-xs">׳׳™׳ ׳×׳׳•׳ ׳”</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-stone-800 leading-tight">{order.plantType}</h3>
                      <p className="text-xs text-stone-400">{order.plantSubType}</p>
                    </div>
                    <span className="text-lg font-black text-emerald-800">ג‚×{order.final_amount}</span>
                  </div>
                  
                  <p className="text-[10px] text-stone-400 mt-2">
                    {order.role === "buyer" ? `׳׳•׳›׳¨: ${order.counterPartyName}` : `׳§׳•׳ ׳”: ${order.counterPartyName}`}
                  </p>
                </div>
              </div>

              {/* ׳×׳™׳׳•׳ ׳׳™׳§׳•׳ ׳׳₪׳’׳© */}
              <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100 space-y-3">
                <div className="flex items-center gap-2 text-stone-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-wider">׳×׳™׳׳•׳ ׳׳™׳§׳•׳ ׳׳₪׳’׳©</span>
                </div>

                {order.role === "seller" ? (
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder={order.meeting_point || "׳”׳–׳ ׳›׳×׳•׳‘׳× ׳׳• ׳ ׳§׳•׳“׳× ׳׳₪׳’׳©..."}
                      className="flex-1 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 ring-emerald-500"
                      value={meetingPointInput[order._id] || ""}
                      onChange={(e) => setMeetingPointInput({...meetingPointInput, [order._id]: e.target.value})}
                    />
                    <button 
                      onClick={() => handleUpdateMeetingPoint(order._id)}
                      className="bg-stone-800 text-white px-4 rounded-xl font-bold text-xs"
                    >
                      ׳¢׳“׳›׳
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-800 font-medium">
                      {order.meeting_point || "׳׳׳×׳™׳ ׳׳¢׳“׳›׳•׳ ׳”׳׳•׳›׳¨..."}
                    </p>
                    {order.meeting_point && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.meeting_point)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg"
                      >
                        ׳₪׳×׳— ׳‘׳׳₪׳”
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* ׳›׳₪׳×׳•׳¨ ׳¦'׳׳˜ */}
              <button 
                onClick={() => setOpenChat(openChat === order._id ? null : order._id)}
                className="mt-2 text-[11px] font-bold text-stone-500 flex items-center justify-center gap-2 py-2 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors"
              >
                {openChat === order._id ? "׳¡׳’׳•׳¨ ׳¦'׳׳˜" : "׳₪׳×׳— ׳¦'׳׳˜ ׳׳×׳™׳׳•׳"}
                <span className="text-sm">נ’¬</span>
              </button>

              {openChat === order._id && <OrderChat orderId={order._id} currentUserId={currentUser?._id} />}

              {/* ׳׳ ׳’׳ ׳•׳ ׳׳™׳׳•׳× ׳₪׳™׳–׳™ */}
              <div className="pt-3 border-t border-stone-100">
                {order.shipping_status === "pending" && (
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    {order.role === "seller" ? (
                      <div className="text-center">
                        <p className="text-xs text-emerald-800 font-bold mb-2">׳§׳•׳“ ׳׳™׳׳•׳× ׳׳׳¡׳™׳¨׳” (׳”׳¦׳’ ׳׳§׳•׳ ׳”):</p>
                        <div className="bg-white py-3 rounded-xl border-2 border-dashed border-emerald-200 text-2xl font-black tracking-widest text-emerald-900">
                          {order.verification_code}
                        </div>
                        <p className="text-[10px] text-emerald-600 mt-2 italic">׳”׳§׳•׳ ׳” ׳™׳¡׳¨׳•׳§/׳™׳–׳™׳ ׳§׳•׳“ ׳–׳” ׳‘׳–׳׳ ׳”׳׳₪׳’׳©</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-emerald-800 font-bold">׳ ׳₪׳’׳©׳×׳? ׳”׳–׳ ׳׳× ׳”׳§׳•׳“ ׳©׳”׳׳•׳›׳¨ ׳׳¦׳™׳’:</p>
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            placeholder="CODE"
                            className="flex-1 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-center font-bold tracking-widest uppercase outline-none focus:ring-2 ring-emerald-500"
                            value={verificationInput[order._id] || ""}
                            onChange={(e) => setVerificationInput({...verificationInput, [order._id]: e.target.value})}
                          />
                          <button 
                            onClick={() => handleVerify(order._id)}
                            disabled={isVerifying === order._id}
                            className="bg-emerald-800 text-white px-4 rounded-xl font-bold text-xs"
                          >
                            {isVerifying === order._id ? "׳‘׳•׳“׳§..." : "׳׳׳×"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">׳¡׳˜׳˜׳•׳¡ ׳×׳©׳׳•׳</span>
                  <div className={`text-[11px] font-bold px-3 py-1 rounded-full w-fit ${
                    order.escrow_status === 'released_to_seller' ? 'bg-emerald-50 text-emerald-700' : 
                    order.escrow_status === 'held' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {escrowLabels[order.escrow_status] || order.escrow_status}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">׳¡׳˜׳˜׳•׳¡ ׳׳©׳׳•׳—</span>
                  <div className={`text-[11px] font-bold px-3 py-1 rounded-full w-fit ${
                    order.shipping_status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : 
                    order.shipping_status === 'pending' ? 'bg-stone-100 text-stone-600' : 
                    order.shipping_status === 'shipped' ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {shippingLabels[order.shipping_status] || order.shipping_status}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-stone-300">
                  ׳‘׳•׳¦׳¢ ׳‘- {new Date(order._creationTime).toLocaleDateString('he-IL')}
                </span>
                <Link 
                  href={`/listing/${order.listing_id}`}
                  className="text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  ׳¦׳₪׳” ׳‘׳₪׳¨׳˜׳™ ׳”׳׳•׳“׳¢׳” ג†
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
