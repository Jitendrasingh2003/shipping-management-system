import { useState, useEffect, useRef } from 'react';
import { bugAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { MdAdd, MdClose, MdBugReport, MdSend, MdAndroid } from 'react-icons/md';

export default function VesselFABs() {
  const [showBugModal, setShowBugModal] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);
  const [bugForm, setBugForm] = useState({
    title: '',
    description: '',
    category: 'UI',
    priority: 'medium'
  });
  const [bugLoading, setBugLoading] = useState(false);

  // Chatbot State
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'bot',
      text: 'Hello! I am your ShipTrack Pro AI Assistant. Ask me anything about vessel logs, voyage status, fleet management, or system operations!'
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleBugChange = (e) => {
    setBugForm({ ...bugForm, [e.target.name]: e.target.value });
  };

  const submitBug = async (e) => {
    e.preventDefault();
    if (!bugForm.title || !bugForm.description) {
      return toast.error('Please enter title and description');
    }
    setBugLoading(true);
    try {
      await bugAPI.create(bugForm);
      toast.success('Bug report submitted successfully!');
      setBugForm({ title: '', description: '', category: 'UI', priority: 'medium' });
      setShowBugModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit bug report');
    } finally {
      setBugLoading(false);
    }
  };

  const getAIResponse = (query) => {
    const q = query.toLowerCase();
    
    if (q.includes('ship') || q.includes('vessel') || q.includes('fleet')) {
      return "To add a vessel, go to the **Ship** page in the sidebar and click **Add Ships**. Fill in the IMO number, Flag state, and Vessel type, then click Save. You can view full details (crew and voyages) by clicking the `👁` (View) icon.";
    }
    if (q.includes('voyage') || q.includes('route') || q.includes('destination')) {
      return "To create a voyage, navigate to the **Voyage** tab in the sidebar. Click **+ Add Voyage**, enter the Voyage Number (e.g., V-2026-001), departure/arrival ports, and departure/arrival dates. You can monitor the progress (Planned: 0%, Running: 50%, Completed: 100%) in the list view by clicking the `👁` (View) icon.";
    }
    if (q.includes('bug') || q.includes('report') || q.includes('error') || q.includes('issue')) {
      return "To report a bug, tap the red `+` button in the bottom right corner of any page. Fill in the title, priority, category (UI, Backend, etc.), and a detailed description, then click Submit. Admins can track and manage all bug reports under the Admin Panel.";
    }
    if (q.includes('alarm') || q.includes('warning') || q.includes('alert') || q.includes('trigger')) {
      return "Alarms can be logged by the staff on the **Staff Dashboard** under the **Alarm** tab. Choose the category (Machinery, Navigation, Cargo), severity, and a title (e.g. high cooling water temperature), then trigger the alarm. Managers will see active alarms on their dashboard.";
    }
    if (q.includes('ballast')) {
      return "The **Ballast Water Record Book** is used to log the ballasting, de-ballasting, or exchange of ballast water, which is critical for complying with environmental regulations. Staff log this on their dashboard, and managers can view it in the sidebar.";
    }
    if (q.includes('bunker') || q.includes('fuel')) {
      return "The **Bunker Record Book** tracks fuel bunkering operations. You log the fuel grade (e.g., VLSFO), quantity loaded in metric tons (MT), viscosity, and sulfur content.";
    }
    if (q.includes('ods') || q.includes('refrigerant') || q.includes('gas')) {
      return "The **ODS (Ozone Depleting Substances) Record Book** logs recharging, recovery, or maintenance of machinery containing gases like R-134a or R-404A to comply with MARPOL regulations.";
    }
    if (q.includes('crew') || q.includes('staff')) {
      return "To manage ship staff, go to the **Staff** tab in the Company Panel. Click **Add Staff** to register a crew member. The system will automatically create a login account for them to access the Staff Panel.";
    }
    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return "Hello! How can I assist you with the ShipTrack Pro Shipping Management System today?";
    }
    
    return "I'm here to help with ShipTrack Pro! You can ask me about **Fleet Management**, **Voyage Tracking**, **Logbooks (Deck, Engine, Cargo, ODS, Ballast, Bunker)**, or **Bug Reporting**.";
  };

  const handleSend = (textToSend) => {
    const msgText = textToSend || inputVal;
    if (!msgText.trim()) return;

    // Add user message
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: msgText
    };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputVal('');

    // Simulate bot typing
    setIsTyping(true);
    setTimeout(() => {
      const botResponse = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: getAIResponse(msgText)
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 800);
  };

  const handleChipClick = (suggestion) => {
    handleSend(suggestion);
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="marine-fab-group">
        {/* Chatbot Button */}
        <button
          className="marine-fab marine-fab-chat"
          title="AI Assistant Chatbot"
          onClick={() => {
            setShowChatbot(!showChatbot);
            setShowBugModal(false);
          }}
          style={{ background: showChatbot ? '#8b5cf6' : '#ffffff', color: showChatbot ? '#ffffff' : '#333333' }}
        >
          {showChatbot ? <MdClose size={22} /> : '💬'}
        </button>

        {/* Add/Bug Button */}
        <button
          className="marine-fab marine-fab-add"
          title="Report Bug / Request support"
          onClick={() => {
            setShowBugModal(true);
            setShowChatbot(false);
          }}
        >
          <MdAdd size={24} />
        </button>
      </div>

      {/* AI CHATBOT PANEL */}
      {showChatbot && (
        <div className="marine-chatbot-panel">
          {/* Header */}
          <div className="marine-chatbot-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '18px', display: 'flex' }}><MdAndroid /></span>
              <span>ShipTrack AI Assistant</span>
            </div>
            <button
              onClick={() => setShowChatbot(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: '16px' }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="marine-chatbot-body">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={msg.sender === 'bot' ? 'msg-bot' : 'msg-user'}
                dangerouslySetInnerHTML={{
                  __html: msg.text
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/`(.*?)`/g, '<code>$1</code>')
                }}
              />
            ))}
            
            {isTyping && (
              <div className="msg-bot" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <span className="dot-blink" style={{ animationDelay: '0s' }}>•</span>
                <span className="dot-blink" style={{ animationDelay: '0.2s' }}>•</span>
                <span className="dot-blink" style={{ animationDelay: '0.4s' }}>•</span>
              </div>
            )}
            
            <div ref={chatEndRef} />

            {/* Suggestions Chips at the start/help */}
            {messages.length === 1 && (
              <div className="chatbot-chips" style={{ marginTop: 'auto' }}>
                <div className="chatbot-chip" onClick={() => handleChipClick('How to add a ship?')}>How to add a ship?</div>
                <div className="chatbot-chip" onClick={() => handleChipClick('Explain ODS record book')}>Explain ODS book</div>
                <div className="chatbot-chip" onClick={() => handleChipClick('How to report a bug?')}>How to report a bug?</div>
                <div className="chatbot-chip" onClick={() => handleChipClick('How to trigger an alarm?')}>How to trigger an alarm?</div>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="marine-chatbot-footer"
          >
            <input
              type="text"
              className="marine-chatbot-input"
              placeholder="Ask me something about the system..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
            />
            <button type="submit" className="marine-chatbot-send-btn">
              <MdSend size={16} />
            </button>
          </form>
        </div>
      )}

      {/* BUG REPORT MODAL */}
      {showBugModal && (
        <div className="marine-modal-overlay" onClick={() => setShowBugModal(false)}>
          <div className="marine-modal" onClick={e => e.stopPropagation()}>
            <div className="marine-modal-header">
              <h3 className="marine-modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MdBugReport size={20} style={{ color: '#dc2626' }} />
                Report System Bug
              </h3>
              <button onClick={() => setShowBugModal(false)} className="marine-modal-close">✕</button>
            </div>
            <form onSubmit={submitBug} className="marine-modal-body" style={{ color: '#0f172a' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="marine-label" style={{ color: '#475569', fontWeight: 600 }}>Bug Title <span className="req">*</span></label>
                  <input
                    name="title"
                    value={bugForm.title}
                    onChange={handleBugChange}
                    required
                    className="marine-input"
                    placeholder="Brief summary of the issue"
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="marine-label" style={{ color: '#475569', fontWeight: 600 }}>Category</label>
                    <select
                      name="category"
                      value={bugForm.category}
                      onChange={handleBugChange}
                      className="marine-input marine-select"
                    >
                      <option value="UI">UI / Styling</option>
                      <option value="Backend">Backend / API</option>
                      <option value="Database">Database / Query</option>
                      <option value="Performance">Performance</option>
                      <option value="Security">Security</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="marine-label" style={{ color: '#475569', fontWeight: 600 }}>Priority</label>
                    <select
                      name="priority"
                      value={bugForm.priority}
                      onChange={handleBugChange}
                      className="marine-input marine-select"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="marine-label" style={{ color: '#475569', fontWeight: 600 }}>Description <span className="req">*</span></label>
                  <textarea
                    name="description"
                    value={bugForm.description}
                    onChange={handleBugChange}
                    required
                    rows={4}
                    className="marine-input"
                    placeholder="Describe what happened and how to reproduce it..."
                    style={{ resize: 'vertical', minHeight: '80px' }}
                  />
                </div>
              </div>

              <div className="marine-modal-footer">
                <button type="button" onClick={() => setShowBugModal(false)} className="marine-btn-sec">Cancel</button>
                <button type="submit" className="marine-btn-red" disabled={bugLoading} style={{ background: '#dc2626' }}>
                  {bugLoading ? 'Submitting...' : 'Submit Bug Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
