 "use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Plus, Sparkles, LayoutDashboard, Library, Star, Settings,
  Sun, Moon, Monitor, Copy, Pencil, Trash2, X, ChevronDown, Menu,
  Command, Check, LogOut, LogIn, Tag, WandSparkles, Clock3, Filter,
  MoreHorizontal, ArrowUpRight, PanelLeftClose, BookOpen, Zap, AlertTriangle, Bot, ExternalLink, Archive, RotateCcw, UserRound, ChevronDown as ChevronDownIcon
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type Platform = {
  id: string; user_id?: string; name: string; description: string | null;
  url: string | null; icon: string | null; color: string | null;
  is_archived: boolean; is_system?: boolean; system_key?: string | null; created_at?: string;
};

type Prompt = {
  id: string; user_id?: string; title: string; content: string; description: string;
  category: string; platform: string; tags: string[]; is_favorite: boolean;
  usage_count: number; created_at: string; updated_at: string;
};

const starter: Prompt[] = [
  { id:"demo-1", title:"Analisi strategica di un mercato", description:"Un framework per analizzare un settore in modo strutturato.", content:"Agisci come un consulente strategico senior. Analizza il mercato di {{SETTORE}} in {{PAESE}}. Struttura la risposta in: dimensione e trend, competitor, segmenti clienti, opportunità, rischi e raccomandazioni. Distingui i dati verificati dalle ipotesi.", category:"Business", platform:"ChatGPT", tags:["strategia","analisi"], is_favorite:true, usage_count:12, created_at:new Date().toISOString(), updated_at:new Date().toISOString() },
  { id:"demo-2", title:"Trasforma appunti in un documento", description:"Da note disordinate a un testo professionale e leggibile.", content:"Agisci come un editor professionista. Trasforma i seguenti appunti in un documento chiaro, completo e ben organizzato. Mantieni tutti i concetti importanti, elimina ripetizioni e segnala eventuali informazioni mancanti.\n\nAPPUNTI:\n{{INCOLLA QUI}}", category:"Scrittura", platform:"Claude", tags:["writing","documenti"], is_favorite:false, usage_count:8, created_at:new Date().toISOString(), updated_at:new Date().toISOString() },
  { id:"demo-3", title:"Spiega un concetto tecnico", description:"Spiegazioni progressive con esempi pratici.", content:"Spiegami {{CONCETTO}} come se fossi un collega curioso ma non specialista. Parti dall'intuizione, poi approfondisci il funzionamento, fai un esempio concreto e concludi con 3 errori comuni da evitare.", category:"Learning", platform:"Gemini", tags:["studio","tech"], is_favorite:true, usage_count:21, created_at:new Date().toISOString(), updated_at:new Date().toISOString() },
  { id:"demo-4", title:"Genera idee per contenuti social", description:"Ideazione di contenuti coerenti con un brand.", content:"Sei un content strategist. Il brand è {{BRAND}}, il pubblico è {{TARGET}} e l'obiettivo è {{OBIETTIVO}}. Genera 10 idee originali, ognuna con hook, formato, messaggio chiave e call to action. Evita cliché e varia gli angoli narrativi.", category:"Marketing", platform:"Universale", tags:["social","idee"], is_favorite:false, usage_count:5, created_at:new Date().toISOString(), updated_at:new Date().toISOString() },
];

const defaultCategories = ["Business","Scrittura","Marketing","Learning","Sviluppo","Creatività","Produttività","Generale"];
// Piattaforme incluse in Promptory. Le impostazioni sono salvate per utente su Supabase,
// così anche quelle predefinite possono essere personalizzate senza perdere i prompt collegati.
const systemPlatformDefaults: Platform[] = [
  {id:"system-universale",system_key:"universale",name:"Universale",description:"Prompt utilizzabile con qualsiasi assistente AI",url:"https://chatgpt.com",icon:"🌐",color:"#64748b",is_archived:false,is_system:true},
  {id:"system-chatgpt",system_key:"chatgpt",name:"ChatGPT",description:"Assistente AI di OpenAI",url:"https://chatgpt.com",icon:"✳️",color:"#10a37f",is_archived:false,is_system:true},
  {id:"system-gemini",system_key:"gemini",name:"Gemini",description:"Assistente AI di Google",url:"https://gemini.google.com",icon:"✦",color:"#4285f4",is_archived:false,is_system:true},
  {id:"system-claude",system_key:"claude",name:"Claude",description:"Assistente AI di Anthropic",url:"https://claude.ai",icon:"✳",color:"#c47b55",is_archived:false,is_system:true},
  {id:"system-notebooklm",system_key:"notebooklm",name:"NotebookLM",description:"Assistente di ricerca e sintesi basato sulle tue fonti",url:"https://notebooklm.google.com",icon:"📚",color:"#6478d3",is_archived:false,is_system:true},
  {id:"system-midjourney",system_key:"midjourney",name:"Midjourney",description:"Generazione di immagini con AI",url:"https://www.midjourney.com",icon:"🌌",color:"#5865f2",is_archived:false,is_system:true},
  {id:"system-sora",system_key:"sora",name:"Sora",description:"Generazione video con AI",url:"https://sora.com",icon:"🎬",color:"#171717",is_archived:false,is_system:true},
  {id:"system-altro",system_key:"altro",name:"Altro",description:"Piattaforma generica per strumenti non presenti nell'elenco",url:null,icon:"＋",color:"#94a3b8",is_archived:false,is_system:true}
];

function initials(email: string) { return email?.slice(0,1).toUpperCase() || "P"; }

export default function Home() {
  const [theme,setTheme] = useState("system");
  const [active,setActive] = useState("all");
  const [category,setCategory] = useState("Tutte");
  const [categories,setCategories] = useState<string[]>(defaultCategories);
  const [categoryManager,setCategoryManager] = useState(false);
  const [customPlatforms,setCustomPlatforms] = useState<Platform[]>([]);
  const [platformManager,setPlatformManager] = useState(false);
  const [platformSearch,setPlatformSearch] = useState("");
  const [platformEditing,setPlatformEditing] = useState<Platform|null>(null);
  const [platformFormOpen,setPlatformFormOpen] = useState(false);
  const [platformForm,setPlatformForm] = useState({name:"",description:"",url:"",icon:"",color:"#6558e8"});
  const [platformError,setPlatformError] = useState("");
  const [platformBusy,setPlatformBusy] = useState(false);
  const [profileMenu,setProfileMenu] = useState(false);
  const [newCategory,setNewCategory] = useState("");
  const [categoryError,setCategoryError] = useState("");
  const [renamingCategory,setRenamingCategory] = useState<string|null>(null);
  const [renameValue,setRenameValue] = useState("");
  const [query,setQuery] = useState("");
  const [prompts,setPrompts] = useState<Prompt[]>(starter);
  const [user,setUser] = useState<any>(null);
  const [authReady,setAuthReady] = useState(false);
  const [authMode,setAuthMode] = useState<"login"|"signup">("signup");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [authError,setAuthError] = useState("");
  const [authMessage,setAuthMessage] = useState("");
  const [authBusy,setAuthBusy] = useState(false);
  const [modal,setModal] = useState(false);
  const [editing,setEditing] = useState<Prompt|null>(null);
  const [mobileNav,setMobileNav] = useState(false);
  const [copied,setCopied] = useState("");
  const [menuFor,setMenuFor] = useState("");
  const [form,setForm] = useState({title:"",description:"",content:"",category:"Generale",platform:"Universale",tags:""});
  const [formError,setFormError] = useState("");
  const [confirmDialog,setConfirmDialog] = useState<{title:string;description:string;confirmLabel:string;onConfirm:()=>Promise<void>}|null>(null);
  const [confirmBusy,setConfirmBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("promptory-theme");
    if(saved) setTheme(saved);
    if(!supabase) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({data}) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const {data:{subscription}} = supabase.auth.onAuthStateChange((_event,session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setPrompts(starter);
        setCategories(defaultCategories);
        setCustomPlatforms([]);
        setActive("all");
        setCategory("Tutte");
        setProfileMenu(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("promptory-theme",theme);
  },[theme]);

  useEffect(() => {
    if(!user || !supabase) return;
    supabase.from("prompts").select("*").order("updated_at",{ascending:false}).then(({data,error}) => {
      if(!error && data) setPrompts(data as Prompt[]);
    });
    (async () => {
      // Crea una sola volta le piattaforme di sistema per questo utente.
      // system_key resta stabile anche se l'utente rinomina una piattaforma.
      const seedRows = systemPlatformDefaults.map(({id, ...platform}) => ({...platform,user_id:user.id}));
      const {error: seedPlatformError} = await supabase.from("ai_platforms").upsert(seedRows,{onConflict:"user_id,system_key",ignoreDuplicates:true});
      if (seedPlatformError) console.error("Errore inizializzazione piattaforme predefinite:",seedPlatformError.message);
      const { data: platformData, error: platformLoadError } = await supabase
        .from("ai_platforms").select("*").order("name");
      if (!platformLoadError && platformData) setCustomPlatforms(platformData as Platform[]);
      else if (platformLoadError) console.error("Errore caricamento piattaforme:", platformLoadError.message);
    })();
    (async () => {
      const { error: seedError } = await supabase.from("categories").upsert(
        defaultCategories.map(name => ({ user_id: user.id, name })),
        { onConflict: "user_id,name", ignoreDuplicates: true }
      );
      const { data, error } = await supabase.from("categories").select("name").order("name");
      if(!error && data) setCategories(data.map((item:any) => item.name as string));
      else if(seedError) console.error("Errore caricamento categorie:", seedError.message);
    })();
  },[user]);

  const visible = useMemo(() => prompts.filter(p => {
    const q = query.toLowerCase();
    const matchesQuery = !q || [p.title,p.description,p.content,p.category,p.platform,...p.tags].join(" ").toLowerCase().includes(q);
    const matchesCategory = category === "Tutte" || p.category === category;
    const matchesTab = active === "all" || (active === "favorites" && p.is_favorite) || (active === "recent" && Date.now()-new Date(p.updated_at).getTime()<7*86400000);
    return matchesQuery && matchesCategory && matchesTab;
  }),[prompts,query,category,active]);

  const stats = [
    {label:"Prompt salvati",value:prompts.length,icon:Library},
    {label:"Preferiti",value:prompts.filter(p=>p.is_favorite).length,icon:Star},
    {label:"Categorie",value:new Set(prompts.map(p=>p.category)).size,icon:Tag},
  ];

  const platformOptions = useMemo(() => {
    const names = new Set([...(customPlatforms.length ? customPlatforms : systemPlatformDefaults).filter(p=>!p.is_archived).map(p=>p.name)]);
    // Keep legacy platform names selectable when editing old prompts.
    prompts.forEach(p => names.add(p.platform));
    return [...names].sort((a,b)=>a.localeCompare(b,"it"));
  }, [customPlatforms,prompts]);

  async function addCategory(e:React.FormEvent) {
    e.preventDefault(); setCategoryError("");
    const name = newCategory.trim();
    if(!name) { setCategoryError("Inserisci il nome della categoria."); return; }
    if(name.length > 32) { setCategoryError("Usa al massimo 32 caratteri."); return; }
    if(categories.some(c=>c.toLowerCase()===name.toLowerCase())) { setCategoryError("Questa categoria esiste già."); return; }
    if(user && supabase) {
      const {error} = await supabase.from("categories").insert({user_id:user.id,name});
      if(error) { setCategoryError(error.message); return; }
    }
    setCategories(prev=>[...prev,name].sort((a,b)=>a.localeCompare(b,"it")));
    setNewCategory("");
  }

  async function renameCategory(oldName:string) {
    const name=renameValue.trim(); setCategoryError("");
    if(oldName === "Generale") { setCategoryError("La categoria Generale è riservata e non può essere rinominata."); return; }
    if(!name || name.length>32) { setCategoryError("Inserisci un nome valido (massimo 32 caratteri)."); return; }
    if(categories.some(c=>c.toLowerCase()===name.toLowerCase() && c!==oldName)) { setCategoryError("Esiste già una categoria con questo nome."); return; }
    if(user && supabase) {
      const {error:catError}=await supabase.from("categories").update({name}).eq("user_id",user.id).eq("name",oldName);
      if(catError) { setCategoryError(catError.message); return; }
      const {error:promptError}=await supabase.from("prompts").update({category:name}).eq("user_id",user.id).eq("category",oldName);
      if(promptError) { setCategoryError(promptError.message); return; }
    }
    setCategories(prev=>prev.map(c=>c===oldName?name:c).sort((a,b)=>a.localeCompare(b,"it")));
    setPrompts(prev=>prev.map(p=>p.category===oldName?{...p,category:name}:p));
    if(category===oldName) setCategory(name);
    setRenamingCategory(null); setRenameValue("");
  }

  async function deleteCategory(name:string) {
    if(name === "Generale") { setCategoryError("La categoria Generale è riservata e non può essere eliminata."); return; }
    const count=prompts.filter(p=>p.category===name).length;
    setConfirmDialog({
      title:`Eliminare “${name}”?`,
      description:count
        ? `La categoria verrà eliminata e i suoi ${count} ${count===1?"prompt verrà trasferito":"prompt verranno trasferiti"} in “Generale”. Non perderai alcun contenuto.`
        : "La categoria verrà eliminata. I tuoi prompt non verranno modificati.",
      confirmLabel:"Elimina categoria",
      onConfirm:async()=>{
        if(user && supabase) {
          const {error:promptError}=await supabase.from("prompts").update({category:"Generale"}).eq("user_id",user.id).eq("category",name);
          if(promptError) { setCategoryError(promptError.message); return; }
          const {error:catError}=await supabase.from("categories").delete().eq("user_id",user.id).eq("name",name);
          if(catError) { setCategoryError(catError.message); return; }
        }
        setPrompts(prev=>prev.map(p=>p.category===name?{...p,category:"Generale"}:p));
        setCategories(prev=>prev.filter(c=>c!==name));
        if(category===name) setCategory("Tutte");
        setConfirmDialog(null);
      }
    });
  }

  async function authenticate(e:React.FormEvent) {
    e.preventDefault(); setAuthError(""); setAuthMessage(""); setAuthBusy(true);
    if(!supabase) { setAuthError("Configura Supabase per attivare gli account."); setAuthBusy(false); return; }
    const result = authMode === "signup"
      ? await supabase.auth.signUp({email,password})
      : await supabase.auth.signInWithPassword({email,password});
    if(result.error) setAuthError(result.error.message);
    else if(authMode==="signup" && !result.data.session) setAuthMessage("Account creato. Controlla la tua email per confermare la registrazione.");
    else setUser(result.data.user);
    setAuthBusy(false);
  }

  async function signOut() {
    setProfileMenu(false);
    if (supabase && user?.id !== "demo") {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) { setAuthError(`Impossibile uscire: ${error.message}`); return; }
    }
    setUser(null);
    setPrompts(starter);
    setCategories(defaultCategories);
    setCustomPlatforms([]);
    setCategory("Tutte");
    setActive("all");
    setQuery("");
    setModal(false);
    setCategoryManager(false);
    setPlatformManager(false);
    setConfirmDialog(null);
  }

  function openNew() {
    setEditing(null); setForm({title:"",description:"",content:"",category:"Generale",platform:"Universale",tags:""}); setFormError(""); setModal(true);
  }
  function openEdit(p:Prompt) {
    setEditing(p); setForm({title:p.title,description:p.description,content:p.content,category:p.category,platform:p.platform,tags:p.tags.join(", ")}); setFormError(""); setModal(true); setMenuFor("");
  }
  async function savePrompt(e:React.FormEvent) {
    e.preventDefault(); setFormError("");
    if(!form.title.trim() || !form.content.trim()) { setFormError("Inserisci almeno un titolo e il contenuto del prompt."); return; }
    const now = new Date().toISOString();
    const payload = {title:form.title.trim(),description:form.description.trim(),content:form.content.trim(),category:form.category,platform:form.platform,tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),updated_at:now};
    if(user && supabase) {
      const result = editing
        ? await supabase.from("prompts").update(payload).eq("id",editing.id).select().single()
        : await supabase.from("prompts").insert({...payload,user_id:user.id}).select().single();
      if(result.error) { setFormError(result.error.message); return; }
      if(editing) setPrompts(prev=>prev.map(p=>p.id===editing.id?result.data as Prompt:p));
      else setPrompts(prev=>[result.data as Prompt,...prev]);
    } else {
      if(isSupabaseConfigured) { setFormError("Accedi per salvare i tuoi prompt."); return; }
      if(editing) setPrompts(prev=>prev.map(p=>p.id===editing.id?{...p,...payload}:p));
      else setPrompts(prev=>[{id:crypto.randomUUID(),...payload,is_favorite:false,usage_count:0,created_at:now} as Prompt,...prev]);
    }
    setModal(false);
  }
  async function removePrompt(p:Prompt) {
    setConfirmDialog({
      title:"Eliminare questo prompt?",
      description:`“${p.title}” verrà eliminato definitivamente dalla tua libreria.`,
      confirmLabel:"Elimina prompt",
      onConfirm:async()=>{
        if(user && supabase) {
          const {error}=await supabase.from("prompts").delete().eq("id",p.id);
          if(error) { setConfirmDialog(null); alert(error.message); return; }
        }
        setPrompts(prev=>prev.filter(x=>x.id!==p.id));
        setMenuFor("");
        setConfirmDialog(null);
      }
    });
  }

  async function runConfirmAction() {
    if(!confirmDialog || confirmBusy) return;
    setConfirmBusy(true);
    try { await confirmDialog.onConfirm(); }
    finally { setConfirmBusy(false); }
  }
  async function toggleFavorite(p:Prompt) {
    const next=!p.is_favorite;
    if(user && supabase) { const {error}=await supabase.from("prompts").update({is_favorite:next}).eq("id",p.id); if(error){alert(error.message);return;} }
    setPrompts(prev=>prev.map(x=>x.id===p.id?{...x,is_favorite:next}:x));
  }
  async function copyPrompt(p:Prompt) {
    await navigator.clipboard.writeText(p.content);
    if(user && supabase) await supabase.from("prompts").update({usage_count:p.usage_count+1}).eq("id",p.id);
    setPrompts(prev=>prev.map(x=>x.id===p.id?{...x,usage_count:x.usage_count+1}:x));
    setCopied(p.id); setTimeout(()=>setCopied(""),1600);
  }
  function duplicatePrompt(p:Prompt) {
    const now=new Date().toISOString();
    const clone={...p,id:crypto.randomUUID(),title:`${p.title} (copia)`,is_favorite:false,usage_count:0,created_at:now,updated_at:now};
    if(user && supabase) supabase.from("prompts").insert({...clone,user_id:user.id}).select().single().then(({data,error})=>{if(!error&&data)setPrompts(prev=>[data as Prompt,...prev]);});
    else setPrompts(prev=>[clone,...prev]);
    setMenuFor("");
  }

  function openNewPlatform() {
    setPlatformEditing(null);
    setPlatformFormOpen(true);
    setPlatformForm({name:"",description:"",url:"",icon:"",color:"#6558e8"});
    setPlatformError("");
  }

  function openEditPlatform(platform: Platform) {
    setPlatformEditing(platform);
    setPlatformFormOpen(true);
    setPlatformForm({
      name: platform.name,
      description: platform.description || "",
      url: platform.url || "",
      icon: platform.icon || "",
      color: platform.color || "#6558e8"
    });
    setPlatformError("");
  }

  async function savePlatform(e: React.FormEvent) {
    e.preventDefault();
    setPlatformError("");
    const name = platformForm.name.trim();
    if (!name) { setPlatformError("Il nome della piattaforma è obbligatorio."); return; }
    if (customPlatforms.some(p=>p.name.toLowerCase()===name.toLowerCase() && p.id!==platformEditing?.id)) {
      setPlatformError("Esiste già una piattaforma con questo nome."); return;
    }
    if (platformForm.url.trim() && !/^https?:\/\//i.test(platformForm.url.trim())) {
      setPlatformError("Inserisci un URL valido che inizi con http:// o https://."); return;
    }
    setPlatformBusy(true);
    const payload = {
      name, description: platformForm.description.trim() || null,
      url: platformForm.url.trim() || null, icon: platformForm.icon.trim() || null,
      color: platformForm.color || null, is_archived: platformEditing?.is_archived ?? false,
      is_system: platformEditing?.is_system ?? false,
      system_key: platformEditing?.system_key ?? null
    };
    if (user && user.id !== "demo" && supabase) {
      if (platformEditing && platformEditing.name !== name) {
        const {error: promptRenameError} = await supabase.from("prompts")
          .update({platform:name}).eq("user_id",user.id).eq("platform",platformEditing.name);
        if (promptRenameError) { setPlatformError(promptRenameError.message); setPlatformBusy(false); return; }
        setPrompts(prev=>prev.map(p=>p.platform===platformEditing.name?{...p,platform:name}:p));
      }
      const result = platformEditing
        ? await supabase.from("ai_platforms").update(payload).eq("id",platformEditing.id).select().single()
        : await supabase.from("ai_platforms").insert({...payload,user_id:user.id}).select().single();
      if (result.error) { setPlatformError(result.error.message); setPlatformBusy(false); return; }
      if (platformEditing) setCustomPlatforms(prev=>prev.map(p=>p.id===platformEditing.id?result.data as Platform:p));
      else setCustomPlatforms(prev=>[...prev,result.data as Platform].sort((a,b)=>a.name.localeCompare(b.name,"it")));
    } else {
      const local: Platform = {...payload,id:platformEditing?.id || crypto.randomUUID()};
      if (platformEditing) {
        setCustomPlatforms(prev=>prev.map(p=>p.id===platformEditing.id?local:p));
        if (platformEditing.name!==name) setPrompts(prev=>prev.map(p=>p.platform===platformEditing.name?{...p,platform:name}:p));
      } else setCustomPlatforms(prev=>[...prev,local].sort((a,b)=>a.name.localeCompare(b.name,"it")));
    }
    setPlatformBusy(false);
    setPlatformEditing(null);
    setPlatformFormOpen(false);
    setPlatformForm({name:"",description:"",url:"",icon:"",color:"#6558e8"});
  }

  async function archivePlatform(platform: Platform) {
    const count = prompts.filter(p=>p.platform===platform.name).length;
    if (user && user.id !== "demo" && supabase) {
      const {error} = await supabase.from("ai_platforms").update({is_archived:!platform.is_archived}).eq("id",platform.id);
      if (error) { setPlatformError(error.message); return; }
    }
    setCustomPlatforms(prev=>prev.map(p=>p.id===platform.id?{...p,is_archived:!p.is_archived}:p));
    if (!platform.is_archived && count) {
      // Existing prompts keep their platform label and remain searchable.
      setPlatformError(`${platform.name} è stata archiviata. I ${count} prompt collegati mantengono il riferimento storico.`);
    }
  }

  async function deletePlatform(platform: Platform) {
    if (platform.is_system) return;
    const count = prompts.filter(p => p.platform === platform.name).length;
    setConfirmDialog({
      title: `Eliminare “${platform.name}”?`,
      description: count > 0
        ? `Sei sicuro di voler eliminare questa piattaforma? ${count} ${count === 1 ? "prompt associato verrà spostato" : "prompt associati verranno spostati"} nella piattaforma “Altro”. I prompt e i loro contenuti non verranno eliminati.`
        : "Sei sicuro di voler eliminare questa piattaforma? L'operazione non può essere annullata.",
      confirmLabel: "Sì, elimina piattaforma",
      onConfirm: async () => {
        if (user && user.id !== "demo" && supabase) {
          if (count > 0) {
            const { error: moveError } = await supabase.from("prompts")
              .update({ platform: "Altro" })
              .eq("user_id", user.id)
              .eq("platform", platform.name);
            if (moveError) {
              setPlatformError(`Impossibile spostare i prompt in “Altro”: ${moveError.message}`);
              setConfirmDialog(null);
              return;
            }
          }
          const { error: deleteError } = await supabase.from("ai_platforms")
            .delete().eq("id", platform.id).eq("user_id", user.id);
          if (deleteError) {
            setPlatformError(`I prompt sono stati spostati in “Altro”, ma la piattaforma non è stata eliminata: ${deleteError.message}`);
            setConfirmDialog(null);
            return;
          }
        }
        setPrompts(prev => prev.map(p => p.platform === platform.name ? { ...p, platform: "Altro" } : p));
        setCustomPlatforms(prev => prev.filter(p => p.id !== platform.id));
        setPlatformError("");
        setConfirmDialog(null);
      }
    });
  }

  if(!authReady) return <div className="loading-screen"><div className="brand-mark"><Sparkles size={20}/></div><span>Promptory</span></div>;

  if(!user) return (
    <main className="auth-shell">
      <div className="auth-decoration"><div className="auth-orbit orbit-one"/><div className="auth-orbit orbit-two"/><div className="auth-copy"><div className="brand-lockup"><div className="brand-mark"><Sparkles size={21}/></div><span>promptory</span></div><div className="auth-headline">Le tue idee.<br/><span>Organizzate.</span><br/>Pronte a tutto.</div><p>La libreria personale per i prompt che fanno la differenza.</p><div className="floating-prompt"><div className="tiny-label"><span className="tiny-dot"/> PROMPT IN EVIDENZA</div><strong>Creative thinking partner</strong><p>Agisci come un partner creativo e aiutami a...</p><div className="float-tags"><span>Creatività</span><span>ChatGPT</span></div></div></div><div className="auth-foot">YOUR AI WORKSPACE · MADE FOR IDEAS</div></div>
      <div className="auth-panel"><div className="auth-mobile-brand brand-lockup"><div className="brand-mark"><Sparkles size={20}/></div><span>promptory</span></div><div className="auth-form-wrap"><div className="eyebrow">IL TUO SPAZIO AI</div><h1>{authMode==="signup"?"Crea il tuo account":"Bentornato"}</h1><p className="muted">{authMode==="signup"?"Inizia a costruire la tua libreria di prompt.":"Accedi per ritrovare tutti i tuoi prompt."}</p>
        {!isSupabaseConfigured && <div className="setup-notice"><Zap size={16}/><span>Anteprima attiva. Collega Supabase per abilitare registrazione e salvataggio cloud.</span></div>}
        <form onSubmit={authenticate} className="auth-form"><label>Email<input type="email" placeholder="nome@esempio.it" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" placeholder="Almeno 8 caratteri" minLength={8} value={password} onChange={e=>setPassword(e.target.value)} required/></label>{authError&&<div className="error-text">{authError}</div>}{authMessage&&<div className="success-text">{authMessage}</div>}<button className="primary-btn full" disabled={authBusy||!isSupabaseConfigured}>{authBusy?"Attendi…":authMode==="signup"?"Crea account":"Accedi"}<ArrowUpRight size={17}/></button></form>
        {!isSupabaseConfigured && <button type="button" className="secondary-btn full preview-btn" onClick={()=>setUser({id:"demo",email:"demo@promptory.app"})}>Entra in anteprima <ArrowUpRight size={16}/></button>}
        <div className="auth-switch">{authMode==="signup"?"Hai già un account?":"Non hai un account?"} <button onClick={()=>{setAuthMode(authMode==="signup"?"login":"signup");setAuthError("");setAuthMessage("");}}>{authMode==="signup"?"Accedi":"Registrati"}</button></div><div className="auth-legal">Continuando accetti i nostri Termini di servizio e la Privacy policy.</div></div><div className="auth-bottom">© 2026 Promptory <span>Built for better thinking.</span></div></div>
    </main>
  );

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav?"sidebar-open":""}`}>
        <div className="brand-lockup sidebar-brand"><div className="brand-mark"><Sparkles size={19}/></div><span>promptory</span><button className="mobile-close icon-btn" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
        <button className="new-prompt-btn" onClick={openNew}><Plus size={17}/> Nuovo prompt <span>⌘ K</span></button>
        <div className="nav-label">WORKSPACE</div>
        <nav className="main-nav">
          <button className={active==="all"?"active":""} onClick={()=>{setPlatformManager(false);setActive("all");setCategory("Tutte");setMobileNav(false)}}><LayoutDashboard size={18}/> Tutti i prompt <span className="nav-count">{prompts.length}</span></button>
          <button className={active==="favorites"?"active":""} onClick={()=>{setPlatformManager(false);setActive("favorites");setCategory("Tutte");setMobileNav(false)}}><Star size={18}/> Preferiti <span className="nav-count">{prompts.filter(p=>p.is_favorite).length}</span></button>
          <button className={active==="recent"?"active":""} onClick={()=>{setPlatformManager(false);setActive("recent");setCategory("Tutte");setMobileNav(false)}}><Clock3 size={18}/> Recenti</button>
          <button className={platformManager?"active":""} onClick={()=>{setPlatformManager(true);setPlatformEditing(null);setPlatformError("");setMobileNav(false)}}><Bot size={18}/> Gestione piattaforme AI</button>
        </nav>
        <div className="nav-label category-label">CATEGORIE <button onClick={()=>{setCategoryManager(true);setCategoryError("")}}>+ Gestisci</button></div>
        <nav className="category-nav">{categories.map((c,i)=><button key={c} className={category===c?"active":""} onClick={()=>{setPlatformManager(false);setCategory(category===c?"Tutte":c);setActive("all");setMobileNav(false)}}><span className={`category-dot dot-${i%5}`}/>{c}<span className="nav-count">{prompts.filter(p=>p.category===c).length||""}</span></button>)}</nav>
        <div className="sidebar-bottom"><div className="upgrade-card"><div className="upgrade-icon"><WandSparkles size={17}/></div><strong>La tua creatività, senza limiti.</strong><p>Una libreria ordinata è il primo passo per lavorare meglio con l'AI.</p><span>SPAZIO PERSONALE</span></div><div className="profile-row"><div className="avatar">{initials(user.email)}</div><div className="profile-info"><strong>{user.email?.split("@")[0]}</strong><span>Account personale</span></div><button className="icon-btn" onClick={signOut} title="Esci"><LogOut size={17}/></button></div></div>
      </aside>
      {mobileNav&&<div className="mobile-scrim" onClick={()=>setMobileNav(false)}/>}
      <section className="main-area">
        <header className="topbar"><div className="top-left"><button className="icon-btn mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{platformManager?"Gestione piattaforme AI":active==="favorites"?"Preferiti":active==="recent"?"Recenti":"Tutti i prompt"}</strong></div></div><div className="top-actions"><div className="theme-switch" title="Tema"><button className={theme==="light"?"selected":""} onClick={()=>setTheme("light")}><Sun size={15}/></button><button className={theme==="dark"?"selected":""} onClick={()=>setTheme("dark")}><Moon size={15}/></button><button className={theme==="system"?"selected":""} onClick={()=>setTheme("system")}><Monitor size={15}/></button></div><div className="menu-wrap profile-menu-wrap"><button className="top-avatar profile-avatar-button" aria-label="Apri menu account" aria-expanded={profileMenu} onClick={()=>setProfileMenu(v=>!v)}>{initials(user.email)}</button>{profileMenu&&<div className="dropdown-menu account-dropdown"><div className="account-dropdown-info"><strong>{user.email?.split("@")[0]}</strong><span>{user.email}</span></div><button className="danger" onClick={signOut}><LogOut size={14}/> Esci dall'account</button></div>}</div></div></header>
        {platformManager ? (
          <div className="content-wrap">
            <div className="welcome-row platform-page-heading">
              <div><div className="eyebrow">PERSONALIZZA IL WORKSPACE</div><h1>Gestione piattaforme AI</h1><p className="muted">Organizza e personalizza gli strumenti AI che utilizzi. Anche le piattaforme incluse sono modificabili, ad eccezione di Altro.</p></div>
              <button className="primary-btn" onClick={openNewPlatform}><Plus size={17}/> Nuova piattaforma</button>
            </div>
            <div className="platform-manager-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Cerca una piattaforma..." value={platformSearch} onChange={e=>setPlatformSearch(e.target.value)}/></div><button className="secondary-btn" onClick={()=>setPlatformManager(false)}>Torna alla libreria</button></div>
            {platformError&&<div className="platform-notice">{platformError}</div>}
            {platformFormOpen && (
              <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!platformBusy){setPlatformEditing(null);setPlatformFormOpen(false);setPlatformError("")}}}>
                <form className="prompt-modal platform-edit-form" onSubmit={savePlatform}>
                  <div className="modal-header"><div><div className="eyebrow">{platformEditing?"MODIFICA PIATTAFORMA":"NUOVA PIATTAFORMA"}</div><h2>{platformEditing?"Modifica piattaforma":"Aggiungi una piattaforma AI"}</h2></div><button className="icon-btn" type="button" aria-label="Chiudi" disabled={platformBusy} onClick={()=>{setPlatformEditing(null);setPlatformFormOpen(false);setPlatformForm({name:"",description:"",url:"",icon:"",color:"#6558e8"});setPlatformError("")}}><X size={18}/></button></div>
                  <div className="form-two"><label>Nome *<input autoFocus required maxLength={50} value={platformForm.name} onChange={e=>setPlatformForm({...platformForm,name:e.target.value})} placeholder="Es. Perplexity"/></label><label>Icona / emoji<input maxLength={8} value={platformForm.icon} onChange={e=>setPlatformForm({...platformForm,icon:e.target.value})} placeholder="Es. ✨"/></label></div>
                  <label>Descrizione<input value={platformForm.description} onChange={e=>setPlatformForm({...platformForm,description:e.target.value})} placeholder="A cosa serve questa piattaforma?"/></label>
                  <div className="form-two"><label>URL<input type="url" value={platformForm.url} onChange={e=>setPlatformForm({...platformForm,url:e.target.value})} placeholder="https://..."/><span className="field-hint">Link ufficiale della piattaforma, utilizzato per aprirla dalla relativa card.</span></label><label>Colore<input type="color" className="platform-color-input" value={platformForm.color} onChange={e=>setPlatformForm({...platformForm,color:e.target.value})}/></label></div>
                  {platformError&&<div className="error-text">{platformError}</div>}
                  <div className="modal-actions"><button className="secondary-btn" type="button" disabled={platformBusy} onClick={()=>{setPlatformEditing(null);setPlatformFormOpen(false);setPlatformForm({name:"",description:"",url:"",icon:"",color:"#6558e8"});setPlatformError("")}}>Annulla</button><button className="primary-btn" disabled={platformBusy} type="submit">{platformBusy?"Salvataggio…":"Salva piattaforma"} <ArrowUpRight size={16}/></button></div>
                </form>
              </div>
            )}
            <div className="platform-section-title"><h2>Piattaforme disponibili</h2><span>{(customPlatforms.length ? customPlatforms : systemPlatformDefaults).filter(p=>!p.is_archived).length} strumenti</span></div>
            <div className="platform-grid">
              {(customPlatforms.length ? customPlatforms : systemPlatformDefaults).filter(p=>`${p.name} ${p.description||""}`.toLowerCase().includes(platformSearch.toLowerCase()) ).map(platform=>{
                const used=prompts.filter(p=>p.platform===platform.name).length;
                return <article className={`platform-card ${platform.is_archived?"is-archived":""}`} key={platform.id}>
                  <div className="platform-card-top"><div className="platform-logo" style={{background:platform.color?`${platform.color}18`:undefined,color:platform.color||undefined}}>{platform.icon||<Bot size={20}/>}</div><div className="platform-card-badges">{platform.is_system&&<span>PREDEFINITA</span>}{platform.is_archived&&<span>ARCHIVIATA</span>}</div></div>
                  <h3>{platform.name}</h3><p>{platform.description|| (platform.is_system?"Piattaforma inclusa in Promptory":"Nessuna descrizione")}</p>
                  <div className="platform-card-footer"><span>{used} {used===1?"prompt":"prompt"}</span>{platform.name !== "Altro" && platform.url&&<a href={platform.url} target="_blank" rel="noreferrer" aria-label={`Apri ${platform.name}`}><ExternalLink size={14}/></a>}</div>
                  {platform.system_key !== "altro" && <div className="platform-card-actions"><button className="icon-btn" title="Modifica" onClick={()=>openEditPlatform(platform)}><Pencil size={15}/></button>{!platform.is_system&&<><button className="icon-btn" title={platform.is_archived?"Riattiva":"Archivia"} onClick={()=>archivePlatform(platform)}>{platform.is_archived?<RotateCcw size={15}/>:<Archive size={15}/>}</button><button className="icon-btn category-delete" title="Elimina" onClick={()=>deletePlatform(platform)}><Trash2 size={15}/></button></>}</div>}
                </article>
              })}
            </div>
          </div>
        ) : <div className="content-wrap"><div className="welcome-row"><div><div className="eyebrow">IL TUO WORKSPACE</div><h1>{active==="favorites"?"I tuoi preferiti":active==="recent"?"Usati di recente":"La tua libreria di prompt"}</h1><p className="muted">Tutto quello che ti serve per ottenere il meglio dall'intelligenza artificiale.</p></div><button className="primary-btn" onClick={openNew}><Plus size={17}/> Crea prompt</button></div>
          <div className="stats-grid">{stats.map(({label,value,icon:Icon})=><div className="stat-card" key={label}><div className="stat-icon"><Icon size={17}/></div><div><span>{label}</span><strong>{value.toString().padStart(2,"0")}</strong></div></div>)}</div>
          <div className="library-toolbar"><div className="search-box"><Search size={17}/><input placeholder="Cerca un prompt, una parola o un tag..." value={query} onChange={e=>setQuery(e.target.value)}/><kbd>⌘ K</kbd></div><button className="filter-btn" onClick={()=>setCategory(category==="Tutte"?"Generale":"Tutte")}><Filter size={16}/><span>{category==="Tutte"?"Filtri":"Reset filtri"}</span><ChevronDown size={15}/></button></div>
          <div className="section-heading"><div><h2>{category==="Tutte"?"Tutti i prompt":category}</h2><span>{visible.length} {visible.length===1?"elemento":"elementi"}</span></div><button className="sort-btn"><span>Ultima modifica</span><ChevronDown size={15}/></button></div>
          {visible.length===0?<div className="empty-state"><div className="empty-icon"><BookOpen size={24}/></div><h3>Nessun prompt trovato</h3><p>Prova a modificare la ricerca o crea il tuo primo prompt.</p><button className="primary-btn" onClick={openNew}><Plus size={16}/> Crea prompt</button></div>:<div className="prompt-grid">{visible.map(p=><article className="prompt-card" key={p.id}><div className="card-top"><span className="platform-pill"><span className="platform-dot"/> {p.platform}</span><div className="card-actions"><button className={`icon-btn favorite-btn ${p.is_favorite?"is-favorite":""}`} onClick={()=>toggleFavorite(p)} title="Preferito"><Star size={17} fill={p.is_favorite?"currentColor":"none"}/></button><div className="menu-wrap"><button className="icon-btn" onClick={()=>setMenuFor(menuFor===p.id?"":p.id)}><MoreHorizontal size={18}/></button>{menuFor===p.id&&<div className="dropdown-menu"><button onClick={()=>openEdit(p)}><Pencil size={14}/> Modifica</button><button onClick={()=>duplicatePrompt(p)}><Copy size={14}/> Duplica</button><button className="danger" onClick={()=>removePrompt(p)}><Trash2 size={14}/> Elimina</button></div>}</div></div></div><button className="card-title-btn" onClick={()=>openEdit(p)}><h3>{p.title}</h3></button><p className="card-description">{p.description||"Nessuna descrizione aggiunta."}</p><div className="prompt-preview">{p.content}</div><div className="tag-row">{p.tags.slice(0,3).map(t=><span className="tag" key={t}>#{t}</span>)}{p.tags.length>3&&<span className="tag">+{p.tags.length-3}</span>}</div><div className="card-footer"><span className="category-name"><span className="category-dot dot-0"/>{p.category}</span><span className="usage-count"><Zap size={13}/>{p.usage_count} usi</span><button className={`copy-btn ${copied===p.id?"copied":""}`} onClick={()=>copyPrompt(p)}>{copied===p.id?<><Check size={14}/> Copiato</>:<><Copy size={14}/> Copia</>}</button></div></article>)}</div>}
          <footer className="main-footer"><span>Promptory <span className="footer-dot">·</span> La tua libreria AI</span><span>{prompts.length} prompt salvati</span></footer>
        </div>}
      </section>
      {categoryManager && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setCategoryManager(false);
          }}
        >
          <div className="prompt-modal category-modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">ORGANIZZA LA LIBRERIA</div>
                <h2>Gestisci categorie</h2>
                <p className="muted">Le categorie sono private e associate al tuo account.</p>
              </div>
              <button className="icon-btn" onClick={() => setCategoryManager(false)}>
                <X size={19} />
              </button>
            </div>

            <form onSubmit={addCategory} className="category-add-form">
              <label>
                Nuova categoria
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Es. Ricerca, Coding, Viaggi..."
                  maxLength={32}
                />
              </label>
              <button className="primary-btn" type="submit">
                <Plus size={16} /> Aggiungi
              </button>
            </form>

            {categoryError && <div className="error-text">{categoryError}</div>}

            <div className="category-manager-list">
              {categories.map((name, i) => (
                <div className="category-manager-row" key={name}>
                  <span className={`category-dot dot-${i % 5}`} />
                  {renamingCategory === name ? (
                    <>
                      <input
                        className="category-rename-input"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                      />
                      <button className="secondary-btn" onClick={() => renameCategory(name)} type="button">
                        Salva
                      </button>
                      <button
                        className="icon-btn"
                        onClick={() => {
                          setRenamingCategory(null);
                          setCategoryError("");
                        }}
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="category-manager-name">{name}</span>
                      <span className="category-manager-count">
                        {prompts.filter((p) => p.category === name).length} prompt
                      </span>
                      {name !== "Generale" && (
                        <>
                          <button
                            className="icon-btn"
                            title="Rinomina"
                            onClick={() => {
                              setRenamingCategory(name);
                              setRenameValue(name);
                              setCategoryError("");
                            }}
                            type="button"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            className="icon-btn category-delete"
                            title="Elimina"
                            onClick={() => deleteCategory(name)}
                            type="button"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setCategoryManager(false)} type="button">
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog&&(
        <div className="modal-backdrop confirm-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget&&!confirmBusy)setConfirmDialog(null)}}>
          <section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <div className="confirm-icon"><AlertTriangle size={21}/></div>
            <button className="icon-btn confirm-close" type="button" aria-label="Chiudi" disabled={confirmBusy} onClick={()=>setConfirmDialog(null)}><X size={18}/></button>
            <div className="eyebrow">CONFERMA OPERAZIONE</div>
            <h2 id="confirm-title">{confirmDialog.title}</h2>
            <p id="confirm-description">{confirmDialog.description}</p>
            <div className="confirm-actions">
              <button className="secondary-btn" type="button" disabled={confirmBusy} onClick={()=>setConfirmDialog(null)}>Annulla</button>
              <button className="danger-btn" type="button" disabled={confirmBusy} onClick={runConfirmAction}>{confirmBusy?"Eliminazione…":confirmDialog.confirmLabel}<Trash2 size={15}/></button>
            </div>
          </section>
        </div>
      )}
      {modal&&<div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setModal(false)}}><div className="prompt-modal"><div className="modal-header"><div><div className="eyebrow">{editing?"MODIFICA":"NUOVO ELEMENTO"}</div><h2>{editing?"Modifica prompt":"Crea un nuovo prompt"}</h2></div><button className="icon-btn" onClick={()=>setModal(false)}><X size={19}/></button></div><form onSubmit={savePrompt}><label>Titolo <input autoFocus placeholder="Es. Analisi competitor..." value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Descrizione <input placeholder="A cosa serve questo prompt?" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><div className="form-two"><label>Categoria <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Piattaforma AI <select value={form.platform} onChange={e=>setForm({...form,platform:e.target.value})}>{platformOptions.map(p=><option key={p}>{p}</option>)}</select></label></div><label>Contenuto del prompt <textarea rows={8} placeholder="Scrivi qui il tuo prompt. Usa {{VARIABILE}} per i campi da personalizzare..." value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/><span className="field-hint">Suggerimento: usa {"{{NOME_VARIABILE}}"} per rendere riutilizzabile il prompt.</span></label><label>Tag <input placeholder="es. marketing, strategia, email (separati da virgola)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/></label>{formError&&<div className="error-text">{formError}</div>}<div className="modal-actions"><button type="button" className="secondary-btn" onClick={()=>setModal(false)}>Annulla</button><button className="primary-btn" type="submit">{editing?"Salva modifiche":"Salva prompt"} <ArrowUpRight size={16}/></button></div></form></div></div>}
    </main>
  );
}
