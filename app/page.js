"use client";

import { useState, useEffect } from "react";
import { Tooltip } from "react-tooltip";

export default function DashboardPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [sort, setSort] = useState("latest");
  const [platform, setPlatform] = useState("All");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null means adding, non-null means editing

  // Registration Form State (Order: URL -> Brand -> Title/Platform)
  const [newUrl, setNewUrl] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newPlatform, setNewPlatform] = useState("youtube");
  const [newTitle, setNewTitle] = useState("");
  const [newEmotionScore, setNewEmotionScore] = useState("3");
  const [newImpressionPoint, setNewImpressionPoint] = useState("");
  const [newHookType, setNewHookType] = useState("trend_meme");

  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (sort) queryParams.append("sort", sort);
      if (platform !== "All") queryParams.append("platform", platform);
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);

      const response = await fetch(`/api/test?${queryParams.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch");

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [sort, platform, fromDate, toDate]);

  // URL Auto-fill Logic
  const handleUrlBlur = async () => {
    if (!newUrl || !newUrl.startsWith("http")) return;

    setIsFetchingMeta(true);
    try {
      // Fetch metadata from our new API route
      const response = await fetch(`/api/meta?url=${encodeURIComponent(newUrl)}`);
      if (response.ok) {
        const meta = await response.json();
        if (meta.success) {
          if (meta.platform) setNewPlatform(meta.platform);
          // Only overwrite title if it's currently empty, to avoid erasing user input
          if (meta.title && !newTitle) setNewTitle(meta.title);
        }
      }
    } catch (error) {
      console.error("Failed to fetch URL metadata", error);
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewUrl("");
    setNewBrand("");
    setNewPlatform("youtube");
    setNewTitle("");
    setNewEmotionScore("3");
    setNewImpressionPoint("");
    setNewHookType("trend_meme");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad) => {
    setEditingId(ad.id);
    setNewUrl(ad.url || "");
    setNewBrand(ad.brand || "");
    setNewPlatform(ad.platform || "youtube");
    setNewTitle(ad.ad_title || "");
    setNewEmotionScore(ad.emotion_score || "3");
    setNewImpressionPoint(ad.impression_point || "");
    setNewHookType(ad.hook_type || "trend_meme");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newBrand || !newTitle || !newUrl) return;

    setIsSubmitting(true);
    try {
      const endpoint = editingId ? "/api/edit" : "/api/add";
      const payload = {
        brand: newBrand,
        platform: newPlatform,
        ad_title: newTitle,
        url: newUrl,
        emotion_score: newEmotionScore,
        impression_point: newImpressionPoint,
        hook_type: newHookType
      };

      if (editingId) payload.id = editingId;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        if (editingId) alert("수정 되었습니다.");
        // Reset form
        setNewUrl("");
        setNewBrand("");
        setNewPlatform("youtube");
        setNewTitle("");
        setNewEmotionScore("3");
        setNewImpressionPoint("");
        setNewHookType("trend_meme");
        setIsModalOpen(false);
        setEditingId(null);

        // Reload data
        fetchData();
      } else {
        const errorText = await response.text();
        console.error("Failed to save:", errorText);
        alert(`저장에 실패했습니다. ${errorText}`);
      }
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const response = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        alert("삭제되었습니다.");
        fetchData();
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  // UI Helpers
  const getEmotionDetails = (score) => {
    if (!score && score !== 0) return { color: "text-gray-400", bg: "bg-gray-100", icon: "💬" };
    const s = Number(score);
    if (s <= 2) return { color: "text-red-500", bg: "bg-red-500", icon: "😞" };
    if (s <= 3) return { color: "text-yellow-500", bg: "bg-yellow-500", icon: "😐" };
    return { color: "text-green-500", bg: "bg-green-500", icon: "😊" };
  };

  const getPlatformColor = (pf) => {
    const raw = (pf || "").toLowerCase();
    if (raw === "youtube") return "bg-red-100 text-red-700";
    if (raw === "instagram") return "bg-pink-100 text-pink-700";
    if (raw === "facebook") return "bg-blue-100 text-blue-700";
    if (raw === "ott") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  };

  const getYouTubeThumbnail = (url) => {
    if (!url) return null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  // Dedicated AdCard Component to manage its own thumbnail fetching
  const AdCard = ({ ad, idx }) => {
    const em = getEmotionDetails(ad.emotion_score);
    const imp = Number(ad.impression_point) || 0;

    // Check if it's YouTube first (we can grab thumb directly without API)
    const ytThumb = getYouTubeThumbnail(ad.url);

    // State to hold dynamically fetched thumbnail for non-YT platforms
    const [dynamicThumb, setDynamicThumb] = useState(null);

    useEffect(() => {
      // Only fetch if it has a URL but is not YouTube
      if (ad.url && !ytThumb) {
        let isMounted = true;
        fetch(`/api/meta?url=${encodeURIComponent(ad.url)}`)
          .then(res => res.json())
          .then(meta => {
            if (isMounted && meta.success && meta.thumbnail) {
              setDynamicThumb(meta.thumbnail);
            }
          })
          .catch(err => console.error("Error fetching thumbnail:", err));

        return () => { isMounted = false; };
      }
    }, [ad.url, ytThumb]);

    const displayThumb = ytThumb || dynamicThumb;

    return (
      <div
        className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col relative"
      >
        {/* Tooltip Target for GPT Analysis */}
        {ad.gpt_analysis && (
          <div
            className="absolute top-5 right-5 bg-orange-50 hover:bg-orange-100 border border-orange-100 rounded-full w-8 h-8 flex justify-center items-center text-sm z-10 shadow-sm cursor-help transition-colors"
            data-tooltip-id={`tt-${idx}`}
            data-tooltip-content={ad.gpt_analysis}
          >
            🤖
          </div>
        )}
        <Tooltip id={`tt-${idx}`} place="top" variant="light" className="max-w-xs shadow-xl border border-gray-100 z-50 rounded-2xl !py-3 !px-4 !text-sm !text-gray-700 !leading-relaxed" style={{ backgroundColor: "white" }} />

        {/* Header */}
        <div className="flex justify-between items-start mb-4 pr-10">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold capitalize tracking-wide ${getPlatformColor(ad.platform)}`}>
            {ad.platform}
          </span>
          <time className="text-xs text-gray-400 font-medium whitespace-nowrap mt-1">
            {ad.created_at ? new Date(ad.created_at).toLocaleDateString() : 'Unknown Date'}
          </time>
        </div>

        {/* Dynamic Thumbnail Preview */}
        {displayThumb ? (
          <div className="w-full h-36 mb-4 bg-gray-100 rounded-2xl overflow-hidden relative">
            <img src={displayThumb} alt="thumbnail" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
              <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                <span className="ml-1 text-red-600 text-lg">{ytThumb ? "▶" : "🔗"}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-36 mb-4 bg-gray-100 rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 group-hover:bg-gray-200 transition-colors">
            <span className="text-2xl mb-1 mt-2">🖼️</span>
            <span className="text-xs font-medium text-gray-400">썸네일이 없습니다</span>
          </div>
        )}

        <h3 className="text-lg font-bold text-gray-900 mb-2 leading-snug">
          {ad.ad_title || "Untitled Video"}
        </h3>

        <p className="text-sm font-semibold text-gray-500 mb-6 flex items-center gap-2">
          <span className="text-xl opacity-80">🏬</span> {ad.brand || "Unknown Brand"}
        </p>

        <div className="flex-1 space-y-5">
          {/* Emotion Score */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-gray-400">
              <span>EMOTION SCORE</span>
              <span className={`flex items-center gap-1 ${em.color} text-sm`}>
                {em.icon} {ad.emotion_score || 0}/5
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className={`h-2 rounded-full ${em.bg} transition-all duration-500`} style={{ width: `${(Number(ad.emotion_score || 0) / 5) * 100}%` }}></div>
            </div>
          </div>

          {/* Impression Point */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5 font-bold text-gray-400 uppercase">
              <span>IMPRESSION POINT</span>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm font-semibold text-[#ff7a00] flex items-center gap-2">
              <span>💡</span> {ad.impression_point || "-"}
            </div>
          </div>

          {/* Additional Fields */}
          <div className="text-sm space-y-3 pt-5 mt-3 border-t border-gray-50">
            {ad.target_guess && (
              <div className="flex items-start gap-2.5">
                <span className="inline-flex mt-0.5 text-base opacity-70">🎯</span>
                <span className="text-gray-700 leading-snug">{ad.target_guess}</span>
              </div>
            )}
            {ad.hook_type && (
              <div className="flex items-start gap-2.5">
                <span className="inline-flex mt-0.5 text-base opacity-70">🪝</span>
                <span className="text-gray-700 leading-snug"><span className="font-semibold text-gray-900">Hook:</span> {ad.hook_type}</span>
              </div>
            )}
            {ad.my_comment && (
              <div className="flex items-start gap-2.5">
                <span className="inline-flex mt-0.5 text-base opacity-70">✍️</span>
                <span className="text-gray-600 italic line-clamp-2 leading-relaxed">{ad.my_comment}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button & Controls */}
        <div className="mt-6 pt-4 border-t border-gray-50 space-y-3">
          <a
            href={ad.url ? (!ad.url.startsWith('http') ? `https://${ad.url}` : ad.url) : '#'}
            target="_blank"
            rel="noreferrer"
            className="block w-full text-center bg-gray-50 hover:bg-[#ff7a00] hover:text-white text-gray-700 font-semibold rounded-2xl py-3 transition-colors duration-300"
            onClick={e => !ad.url && e.preventDefault()}
          >
            View Video URL
          </a>

          <div className="flex gap-2">
            <button
              onClick={() => handleOpenEdit(ad)}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-xl py-2 text-sm transition-colors flex items-center justify-center gap-1"
            >
              <span>✏️</span> 수정
            </button>
            <button
              onClick={() => handleDelete(ad.id)}
              className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-xl py-2 text-sm transition-colors flex items-center justify-center gap-1"
            >
              <span>🗑️</span> 삭제
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] p-6 md:p-10 font-sans text-gray-900 relative">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header & Filters */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Video Archive Dashboard</h1>
              <p className="text-gray-500 text-sm mt-1">Browse, filter, and analyze video ads.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleOpenAdd}
                className="bg-[#ff7a00] hover:bg-[#e66c00] text-white font-bold px-5 py-2.5 rounded-2xl shadow-sm shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
              >
                <span>➕</span> Add New Video
              </button>

              <div className="h-6 w-px bg-gray-200 mx-1 hidden md:block"></div>

              <div className="flex bg-gray-100 p-1 rounded-2xl">
                {["All", "youtube", "instagram", "facebook", "ott"].map(p => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl capitalize transition-colors ${platform === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-2xl px-4 py-2.5 outline-none cursor-pointer hover:border-gray-300 transition-colors"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm border-t border-gray-50 pt-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">From</span>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-gray-300 text-gray-700"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 font-medium">To</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-gray-300 text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="min-h-[400px]">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#ff7a00]"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
              <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
              </svg>
              <p className="text-lg font-medium text-gray-900">No results found</p>
              <p className="text-sm mt-1">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((ad, idx) => (
                <AdCard key={ad.id || idx} ad={ad} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-lg overflow-hidden transform transition-all">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>{editingId ? "✏️" : "✨"}</span> {editingId ? "Edit Video" : "Register New Video"}
              </h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingId(null);
                }}
                className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">

              {/* 1. URL First (triggers Autofill) */}
              <div className="space-y-1 relative">
                <label className="text-xs font-semibold text-gray-700 ml-1">Video URL {isFetchingMeta && <span className="text-[10px] text-blue-500 ml-2 animate-pulse">Auto-filling...</span>}</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-colors"
                  placeholder="Paste URL to auto-fill (https://...)"
                />
              </div>

              {/* 2. Brand */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 ml-1">Brand Name</label>
                <input
                  type="text"
                  required
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-colors"
                  placeholder="e.g. Apple"
                />
              </div>

              {/* 3. Platform & Title (Auto-filled but editable) */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Platform</label>
                  <select
                    value={newPlatform}
                    onChange={e => setNewPlatform(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-colors cursor-pointer"
                  >
                    <option value="youtube">YouTube</option>
                    <option value="instagram">Instagram</option>
                    <option value="facebook">Facebook</option>
                    <option value="tiktok">TikTok</option>
                    <option value="ott">OTT</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 ml-1">Video Title / Hook</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-colors"
                  placeholder="The creative hook or title..."
                />
              </div>

              {/* Added Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Emotion Score</label>
                  <select
                    value={newEmotionScore}
                    onChange={e => setNewEmotionScore(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-colors cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5].map(score => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 ml-1">Hook Type</label>
                  <select
                    value={newHookType}
                    onChange={e => setNewHookType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-colors cursor-pointer"
                  >
                    <option value="trend_meme">trend_meme</option>
                    <option value="shock_visual">shock_visual</option>
                    <option value="bgm">bgm</option>
                    <option value="model">model</option>
                    <option value="copy">copy</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 ml-1">Impression Point</label>
                <input
                  type="text"
                  value={newImpressionPoint}
                  onChange={e => setNewImpressionPoint(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-[#ff7a00]/30 focus:border-[#ff7a00] transition-colors"
                  placeholder="Describe the key impression point..."
                />
              </div>

              {/* Submit Action */}
              <div className="pt-2 mt-2 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={isSubmitting || isFetchingMeta}
                  className="w-full bg-[#ff7a00] hover:bg-[#e66c00] active:scale-[0.98] text-white font-bold rounded-xl px-4 py-3 transition-all shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-base"
                >
                  {isSubmitting ? "Processing..." : (editingId ? "Update Video" : "Submit New Video")}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
