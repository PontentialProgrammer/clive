import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup, useMapEvents } from 'react-leaflet';
import { Search, Menu, X, Leaf, Activity, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import Navbar from '../components/Navbar'; 
import { SimpleMapScreenshoter } from 'leaflet-simple-map-screenshoter';
import { generateFullAuditReport } from "../api/gemini_prompting.js";
//Import your research papers at the top
import runoffPaper from '../assets/research_papers/run-off calculation.pdf';
import carbonPaper from '../assets/research_papers/forests-17-00125.pdf';
import nbsPaper from '../assets/research_papers/nbs-for-cities-solutions-and-examples-for-municipalities-and-private-sector.pdf';
import { jsPDF } from "jspdf";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';


// ... other imports ...


const cleanMarkdown = (text) => {
  return text
    .replace(/^```markdown/, '') // Remove starting ```markdown
    .replace(/^```/, '')         // Remove starting ```
    .replace(/```$/, '')         // Remove ending ```
    .trim();
};

const urlToBase64 = async (url) => {
  try{
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch paper: ${url}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  catch (e){
    console.error("PDF Fetch Error:", e);
    return null;
  }
  
};

// Define the constant array for the papers
const GROUNDING_PAPERS = [
  { name: 'Runoff Model', url: runoffPaper },
  { name: 'Carbon Model', url: carbonPaper },
  { name: 'NBS Catalogue', url: nbsPaper }
];

function MapCapture({ setScreenshot }) {
  const map = useMap();
  
  useEffect(() => {
    const screenshoter = new SimpleMapScreenshoter({
      hidden: true, 
    }).addTo(map);

    // Save the reference to the global window so our button can find it
    window.mapScreenshoter = screenshoter;
  }, [map]);

  return null;
}

// function ChangeView({ center }) {
//   const map = useMap();
//   map.setView(center, 16);
//   return null;
// }

function ChangeView({ center }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      // Get the current zoom level instead of a hardcoded 16
      const currentZoom = map.getZoom();
      map.setView(center, currentZoom, {
        animate: true // This makes the transition feel smooth and professional
      });
    }
  }, [center, map]);

  return null;
}


function MapClickHandler({ setMapCenter }) {
  const map = useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      setMapCenter([lat, lng]); // Move the marker to where you clicked
    },
  });
  return null;
}

export default function Dashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]);
  const [loading, setLoading] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const [radius, setRadius] = useState(500);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isResultOpen, setIsResultOpen] = useState(false);


  const [papers, setPapers] = useState([]); // Array of actual File objects
  const [mapImage, setMapImage] = useState(null); // Base64 string of the map

  // 2. AI Responses
  const [fullReport, setFullReport] = useState(""); // The <markdown_report>


  // const fileToBase64 = (file) => {
  //   return new Promise((resolve, reject) => {
  //     const reader = new FileReader();
  //     reader.readAsDataURL(file);
  //     reader.onload = () => resolve(reader.result.split(',')[1]); // Remove the data:application/pdf prefix
  //     reader.onerror = (error) => reject(error);
  //   });
  // };

  const fileToBase64 = (fileOrBlob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Use split to remove the "data:*/*;base64," prefix
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrBlob);
    });
  };

  
  const startAnalysis = async () => {
    console.log("🚀 Analysis Started...");
    setIsAnalyzing(true);
    setIsSidebarOpen(true);
    setAnalysisData(null); 
    setIsResultOpen(false);

    try {
      // A. Snapshot the Map
      const blob = await window.mapScreenshoter.takeScreen('blob');
      
      const mapBase64 = await fileToBase64(blob);
      console.log("✅ Map Captured", blob);

      // const url = window.URL.createObjectURL(blob);
      // const link = document.createElement('a');
      // link.href = url;
      // link.download = `map-debug-${Date.now()}.png`; // Name of the file
      // document.body.appendChild(link);
      // link.click();
      // document.body.removeChild(link);
      // window.URL.revokeObjectURL(url);

      // B. Process the pre-loaded scientific papers automatically
      const paperBase64s = await Promise.all(
        GROUNDING_PAPERS.map(paper => urlToBase64(paper.url))
      );
      console.log("✅ Papers Processed:", paperBase64s.length, "files");
      console.log(paperBase64s);
      // C. Call Gemini with Map Image + 3 PDFs

      console.log("📡 Sending to Gemini...");
      const result = await generateFullAuditReport(mapBase64, paperBase64s, radius);
      console.log("✅ Gemini Responded:", result);
      // D. Update states with scientific response
      setAnalysisData(result.summary);
      setFullReport(result.report);
      setIsResultOpen(true);

      console.log(fullReport);

    } catch (error) {
      console.error("Analysis failed:", error);
      alert("AI Analysis encountered an error. Please check your API key and file paths.");
    } finally {
      setIsAnalyzing(false);
      setIsSidebarOpen(false); // Close left sidebar to focus on results
    }

    // try {
    // // 1. Snapshot the Map
    //   const blob = await window.mapScreenshoter.takeScreen('blob');
    //   const mapBase64 = await fileToBase64(blob);

    //   // 2. Prepare Papers (Assuming you have them in state/files)
    //   // For now, let's assume 'papers' is an array of your PDF files
    //   const paperBase64s = await Promise.all(papers.map(fileToBase64));

    //   // 3. Call your updated gemini.js function
    //   const result = await generateFullAuditReport(mapBase64, paperBase64s, radius);
      
    //   setAnalysisData(result.summary);
    //   setFullReport(result.report);
    //   setIsResultOpen(true);

    // } catch (error) {
    //   console.error("Analysis failed:", error);
    // } finally {
    //   setIsAnalyzing(false);
    //   setIsSidebarOpen(false);

    // }
    
    // setTimeout(() => {
    //   setIsAnalyzing(false);
    //   setAnalysisData({
    //     carbon: "12.4 tons/yr",
    //     floodRisk: "Moderate",
    //     spongePotential: "High",
    //     recommendation: "Install 3 Bioswales along the northern slope."
    //   });

    //   setIsSidebarOpen(false);
    //   setIsResultOpen(true);
    // }, 3000);
  };
  const handlePrint = () => {
    if (!fullReport) {
      alert("Please run the AI analysis first to generate a report.");
      return;
  }
    // We can add a custom title to the browser's save dialog
    const originalTitle = document.title;
    document.title = `Environmental_Audit_${mapCenter[0].toFixed(4)}_${mapCenter[1].toFixed(4)}`;
    
    setTimeout(() => {
      window.print();
    
      // Restore original title after print dialog closes
      document.title = originalTitle;
    }, 500)
    
  };
  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // PDF Title & Header
    doc.setFontSize(22);
    doc.setTextColor(5, 150, 105); // Emerald-600
    doc.text("Environmental Site Audit Report", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} | Auditor: Timi`, 20, 30);
    doc.line(20, 35, 190, 35); // Horizontal line

    // The Content
    doc.setFontSize(12);
    doc.setTextColor(0);
    
    // We use splitTextToSize to make sure the text wraps within the PDF pages
    const splitText = doc.splitTextToSize(fullReport, 170);
    doc.text(splitText, 20, 50);

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      "Methodology: Calculations based on SCS-CN Hydrological Models and Simpson 3D Green Quantity (3DGQ) metrics.",
      20, 
      pageHeight - 10
    );
    // Save the file
    doc.save(`Audit_Report_${Date.now()}.pdf`);
  };


  const handleSearch = async (e) => {
    if (e.key === 'Enter' && searchQuery) {
        setIsSidebarOpen(false);
        setLoading(true);
        try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            const { lat, lon } = data[0];
            setMapCenter([parseFloat(lat), parseFloat(lon)]); // Update the center
        }
        } catch (error) {
        console.error("Search error:", error);
        } finally {
        setLoading(false);
        }
    }
  };
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* 1. Shared Navbar */}
      <Navbar />

      <div className="flex flex-1 relative overflow-hidden">
        
        {/* MOBILE TOGGLE BUTTON 
            logic: !isSidebarOpen && (...) means it only shows when closed */}
        {!isSidebarOpen && !isResultOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden absolute top-3 left-12  z-[2000] bg-white p-3 rounded-xl shadow-lg border border-emerald-100 text-emerald-600 animate-in fade-in duration-300"
          >
            <Menu size={24} />
          </button>
        )}

        {/* SIDEBAR PANEL */}
        <aside className={`
          absolute md:relative z-[1500] h-full
          w-80 md:w-96 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'left-0' : '-left-full md:left-0'}
        `}>
          <div className="p-6 h-full flex flex-col">
            {/* Sidebar Header with Close Icon */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                {/* <Leaf size={20} /> */}
                <span>Site Audit</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)} 
                className="md:hidden p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-4   text-slate-400" size={17} />
              <input 
                type="text"
                placeholder="Search an address..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-1.5 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                <p className="text-slate-400 text-sm font-medium">Ready for Audit</p>
                <p className="text-xs text-slate-400 mt-2">Enter a location to analyze flood risk and carbon potential.</p>
              </div>
            </div>

            
            <div className="mb-2">
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block text-left">
                Audit Radius: {radius}m
              </label>
              <input 
                type="range" 
                min="100" 
                max="1000" 
                step="50"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full h-2 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>100m</span>
                <span>1km</span>
              </div>
            </div>
            <button 
                onClick={() => setIsSatellite(!isSatellite)}
                className="mb-2 w-full border border-slate-200 py-2 rounded-xl text-sm font-semibold hover:bg-slate-50 transition flex items-center justify-center gap-2"
                >
                {isSatellite ? "Switch to Street View" : "Switch to Satellite View"}
            </button>
            <button 
              onClick={startAnalysis}
              disabled={isAnalyzing}
              className={`w-full py-4 rounded-xl font-bold transition shadow-lg mt-6 flex items-center justify-center gap-2 ${
                isAnalyzing 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                  Analyzing Site...
                </>
              ) : (
                "Run AI Analysis"
              )}
            </button>
          </div>
          
        </aside>
        <aside className={`
          absolute right-0 top-0 z-[1500] h-full
          w-full md:w-96 bg-white border-l border-slate-200 transition-all duration-500 ease-in-out shadow-2xl
          ${isResultOpen ? 'translate-x-0' : 'translate-x-full'}
        `}>
          {/* The Toggle Tab (The Arrow) */}
          <button onClick={() => setIsResultOpen(!isResultOpen)} className=" md:flex absolute left-[-40px] top-1/2 -translate-y-1/2 bg-white border border-r-0 border-slate-200 p-2 rounded-l-xl shadow-lg text-emerald-600" >
            {isResultOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
          </button>
          <button 
            onClick={() => setIsResultOpen(false)}
            className="md:hidden absolute top-4 right-4 z-[1600] p-2 bg-slate-100 rounded-full text-slate-500"
          >
            <X size={20} />
          </button>

          {/* ADJUSTED: Added flex flex-col and h-full to the wrapper */}
          <div className="flex flex-col h-full">
            
            {/* Sidebar Header (Fixed at top) */}
            <div className="p-6 border-b border-slate-50 flex items-center gap-2 text-emerald-900 font-bold text-lg">
              <Activity size={20} className="text-emerald-500" />
              <h3>Analysis Report</h3>
            </div>

            {/* <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-emerald-200">
              {analysisData ? (
                <> */}
                  
                  {/* <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">CO₂ Sequestration</p>
                    <p className="text-2xl font-black text-emerald-900">{analysisData.carbon}</p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Flood Vulnerability</p>
                    <p className="text-2xl font-black text-orange-900">{analysisData.floodRisk}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">AI Recommendations</h4>
                    <p className="text-sm text-slate-600 leading-relaxed italic bg-slate-50 p-4 rounded-xl">
                      "{analysisData.recommendation}"
                    </p>
                  </div> */}
                  {/* Inside your Right Sidebar scrollable area */}
                  {/* <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest mb-2">CO₂ Sequestration</p>
                    <p className="text-2xl font-black text-emerald-900">{analysisData.carbon_tons} tons/yr</p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                    <p className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-2">Flood Vulnerability</p>
                    <p className="text-2xl font-black text-orange-900">{analysisData.flood_risk}</p>
                  </div> */}

                  {/* Methodology Note - Judges love this part */}
                  {/* <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Methodology</p>
                    <p className="text-[11px] text-slate-600">
                      Calculated using SCS-CN (CN: {analysisData.cn_value}) & ISM for 3DGQ.
                    </p>
                  </div> */}
                  {/* <div className="flex-1 overflow-y-auto p-6 bg-white shadow-inner">
                    {fullReport ? (
                      <article className="
                        prose prose-sm md:prose-base 
                        prose-slate 
                        prose-headings:font-bold 
                        prose-h1:text-2xl 
                        prose-h2:text-xl 
                        prose-emerald 
                        max-w-none 
                        text-justify
                      ">
                        <ReactMarkdown>{cleanMarkdown(fullReport)}</ReactMarkdown>
                      </article>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Activity size={48} className="mb-4 opacity-20" />
                        <p>Awaiting site data...</p>
                      </div>
                    )}
                  </div> */}

                  {/* <button 
                    className="w-full py-4 bg-emerald-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-2 mt-4"
                    onClick={downloadPDF}
                    disabled={!fullReport}
                  >
                    <Download size={18} /> Download Detailed Audit
                  </button> */}
                  
                  {/* Add more dummy content here to test the scroll! */}
                  {/* <div className="h-40 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400 text-center px-4">
                    Additional metrics like Soil pH, Ground Moisture, and Albedo effect would appear here.
                  </div> */}
                {/* </> */}
              {/* ) : (
                <p className="text-slate-400 text-sm text-center mt-20">No data available yet.</p>
              )}
            </div> */}
            <aside className={`
                absolute right-0 top-0 z-[1500] h-full
                w-full md:w-[450px] bg-white border-l border-slate-200 
                transition-all duration-500 ease-in-out shadow-2xl
                ${isResultOpen ? 'translate-x-0' : 'translate-x-full'}
              `}>
                {/* The Toggle Tab */}
                <button onClick={() => setIsResultOpen(!isResultOpen)} className="hidden md:flex absolute left-[-40px] top-1/2 -translate-y-1/2 bg-white border border-r-0 border-slate-200 p-2 rounded-l-xl shadow-lg text-emerald-600">
                  {isResultOpen ? <ChevronRight size={24} /> : <ChevronLeft size={24} />}
                </button>

                <div className="flex flex-col h-full bg-slate-50/50">
                  <div className="hidden print:block mb-8 border-b-2 border-emerald-800 pb-4">
                    <h1 className="text-3xl font-bold text-emerald-900">Site-Specific Environmental Audit</h1>
                    <p className="text-slate-500 mt-2">
                      Coordinates: {mapCenter[0]}, {mapCenter[1]} | Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>
                  {/* Sidebar Header: Increased padding and better border */}
                  <div className="px-8 py-6 border-b border-slate-200 bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3 text-emerald-900 font-bold text-xl">
                      <Activity size={24} className="text-emerald-500" />
                      <h3>Site Audit Report</h3>
                    </div>
                    <button onClick={() => setIsResultOpen(false)} className="md:hidden p-2 bg-slate-100 rounded-full text-slate-500">
                      <X size={20} />
                    </button>
                  </div>

                  {/* Scrollable Content: Increased inner padding (p-8) and spacing (space-y-8) */}
                  <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-emerald-200">
                    {analysisData ? (
                      <>
                        {/* Metrics Grid: Two columns for a more dashboard-like feel */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CO₂ Sequestration</p>
                            <p className="text-xl font-black text-emerald-600">{analysisData.carbon_tons} <span className="text-xs font-normal text-slate-500">t/yr</span></p>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Flood Risk</p>
                            <p className={`text-xl font-black ${analysisData.flood_risk === 'Severe' ? 'text-red-600' : 'text-orange-500'}`}>
                              {analysisData.flood_risk}
                            </p>
                          </div>
                        </div>

                        {/* Methodology Card: More padding and internal structure */}
                        <div className="bg-emerald-900 text-emerald-50 p-6 rounded-2xl shadow-lg">
                          <h4 className="text-xs font-bold uppercase tracking-widest mb-3 opacity-70">Scientific Methodology</h4>
                          <div className="space-y-2">
                            <p className="text-sm leading-relaxed">
                              Calculations derived from the <span className="font-bold underline text-white text-xs">SCS-CN</span> runoff model 
                              and <span className="font-bold underline text-white text-xs">Simpson 3DGQ</span> metric.
                            </p>
                            <div className="pt-2 flex gap-4">
                              <div className="text-[10px]">
                                <span className="block opacity-60">CN VALUE</span>
                                <span className="font-mono text-white text-xs">{analysisData.cn_value}</span>
                              </div>
                              <div className="text-[10px]">
                                <span className="block opacity-60">RADIUS</span>
                                <span className="font-mono text-white text-xs">{radius}m</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Markdown Section: Added a paper-like wrapper */}
                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                          <article className="prose prose-emerald prose-sm max-w-none">
                            <ReactMarkdown 
                              remarkPlugins={[remarkMath, remarkGfm]} 
                              rehypePlugins={[rehypeKatex]}>
                              {cleanMarkdown(fullReport)}</ReactMarkdown>
                          </article>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300 italic">
                        <Leaf size={40} className="mb-4 opacity-20" />
                        <p>Awaiting site selection...</p>
                      </div>
                    )}
                  </div>

                  {/* Footer Action: More vertical padding */}
                  <div className="p-8 bg-white border-t border-slate-200">
                    <button 
                      onClick={handlePrint}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95"
                    >
                      <Download size={20} />
                      <span>Export Professional Audit</span>
                    </button>
                  </div>
                </div>
              </aside>

            {/* Fixed Footer (Download button stays at bottom) */}
            {/* <div className="mb-3 p-6 border-t border-slate-100 bg-white">
              <button className="w-full py-3 border-2 border-emerald-600 text-emerald-600 rounded-xl font-bold hover:bg-emerald-600 hover:text-white transition-all">
                Export Audit
              </button>
            </div> */}
          </div>
        </aside>

        {/* MOBILE OVERLAY */}
        {isSidebarOpen && (
          <div 
            className="md:hidden absolute inset-0 bg-slate-900/40 z-[1400] backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* MAIN MAP VIEW */}
        <main className="flex-1 relative z-0">
          {/* key={`${mapCenter[0]}-${mapCenter[1]}`} */}
          <MapContainer  center={[6.5244, 3.3792]} scrollWheelZoom={true} zoom={13} className="h-full w-full">
            <ChangeView center={mapCenter} />
            <MapCapture />
            <MapClickHandler setMapCenter={setMapCenter} />
            <TileLayer 
                url={isSatellite 
                    ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                }
                attribution={isSatellite ? 'Tiles &copy; Esri' : '&copy; OpenStreetMap'}
            />
            <Marker position={mapCenter}>
              <Popup>
                <div className="text-center p-1">
                  <p className="font-bold text-emerald-800 mb-2 text-sm">Target Site</p>
                  <button 
                    onClick={startAnalysis}
                    className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition"
                  >
                    Analyze This Spot
                  </button>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
          {isAnalyzing && (
            <div className="absolute inset-0 z-[1001] backdrop-blur-md bg-white/30 flex flex-col items-center justify-center transition-all duration-500">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                <Leaf className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-600" size={20} />
              </div>
              
              <div className="mt-4 text-center">
                <p className="text-emerald-900 font-bold text-lg animate-pulse">Consulting Gemini 3...</p>
                <p className="text-emerald-700 text-sm">Processing terrain & vegetation density</p>
              </div>
            </div>
          )}
        </main>
      </div>
      {/* --- PLACE THIS AT THE VERY BOTTOM OF YOUR DASHBOARD RETURN --- */}
<div className="hidden print:block p-12 bg-white min-h-screen print-portal">
  <div className="border-b-4 border-emerald-900 pb-6 mb-8">
    <h1 className="text-4xl font-black text-emerald-900 uppercase">Site Audit Report</h1>
    <div className="flex justify-between mt-4 text-slate-600 font-bold">
      <p>Coordinates: {mapCenter[0].toFixed(5)}, {mapCenter[1].toFixed(5)}</p>
      <p>Date: {new Date().toLocaleDateString()}</p>
    </div>
  </div>

  {analysisData && (
    <div className="grid grid-cols-2 gap-8 mb-10 border-2 border-slate-100 p-6 rounded-2xl">
      <div>
        <p className="text-xs text-slate-400 uppercase font-bold">CO₂ Sequestration</p>
        <p className="text-2xl font-bold text-emerald-700">{analysisData.carbon_tons} tons/yr</p>
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase font-bold">Flood Vulnerability</p>
        <p className="text-2xl font-bold text-orange-600">{analysisData.flood_risk}</p>
      </div>
    </div>
  )}

  <article className="prose prose-emerald max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkMath, remarkGfm]} 
      rehypePlugins={[rehypeKatex]}
    >{cleanMarkdown(fullReport)}</ReactMarkdown>
  </article>

  <div className="mt-20 pt-8 border-t border-slate-200 text-center text-xs text-slate-400 italic">
    Scientific Audit generated via SCS-CN and ISM grounding methodology.
  </div>
</div>
    </div>
  );
}