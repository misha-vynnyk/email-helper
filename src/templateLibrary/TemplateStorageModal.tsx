/**
 * Template Storage Modal
 * Manage storage locations for template synchronization with add/remove capabilities
 */

import { useState } from "react";
import { createPortal } from "react-dom";

import {
  FolderOpen,
  Plus as AddIcon,
  X as CloseIcon,
  Trash2 as DeleteIcon,
  Star as StarIcon,
  Eye as VisibilityIcon,
  EyeOff as VisibilityOffIcon,
} from "lucide-react";

import {
  addTemplateStorageLocation,
  getTemplateStorageLocations,
  removeTemplateStorageLocation,
  setDefaultTemplateLocation,
  TemplateStorageLocation,
  toggleTemplateLocationVisibility,
} from "./templateStorageConfig";

interface TemplateStorageModalProps {
  open: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export default function TemplateStorageModal({ open, onClose, onSave }: TemplateStorageModalProps) {
  const [locations, setLocations] = useState<TemplateStorageLocation[]>(
    getTemplateStorageLocations(true)
  );
  const [newLocationName, setNewLocationName] = useState("");
  const [newLocationPath, setNewLocationPath] = useState("");
  const [newLocationDescription, setNewLocationDescription] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleAddLocation = () => {
    try {
      if (!newLocationName.trim() || !newLocationPath.trim()) {
        setError("Name and path are required");
        return;
      }

      const trimmedPath = newLocationPath.trim();
      if (!trimmedPath.startsWith("/")) {
        setError("Path must be absolute (start with /). Example: /Users/your-name/Documents/templates");
        return;
      }

      const updated = addTemplateStorageLocation(newLocationName, trimmedPath, newLocationDescription);
      setLocations(updated);
      setNewLocationName("");
      setNewLocationPath("");
      setNewLocationDescription("");
      setShowAddForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add location");
    }
  };

  const handleToggleVisibility = (id: string) => {
    try {
      const updated = toggleTemplateLocationVisibility(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle visibility");
    }
  };

  const handleRemoveLocation = (id: string) => {
    try {
      const updated = removeTemplateStorageLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove location");
    }
  };

  const handleSetDefault = (id: string) => {
    try {
      const updated = setDefaultTemplateLocation(id);
      setLocations(updated);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set default");
    }
  };

  const handleClose = () => {
    setLocations(getTemplateStorageLocations(true));
    setNewLocationName("");
    setNewLocationPath("");
    setNewLocationDescription("");
    setShowAddForm(false);
    setError(null);
    setSaved(false);
    onClose();
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      if (onSave) onSave();
      handleClose();
    }, 500);
  };

  const visibleLocations = locations.filter((loc) => !loc.isHidden);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" onClick={handleClose} />
      <div className="relative w-full max-w-3xl bg-card border border-border/50 rounded-2xl shadow-soft flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[95vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
          <div>
            <h2 className="text-lg font-bold text-foreground">Template Storage Locations</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Manage directories for template synchronization</p>
          </div>
          <button onClick={handleClose} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors flex-shrink-0">
            <CloseIcon size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex justify-between items-start">
              <p className="text-sm font-bold">{error}</p>
              <button onClick={() => setError(null)} className="p-1 hover:bg-destructive/20 rounded-lg transition-colors"><CloseIcon size={16}/></button>
            </div>
          )}

          {saved && (
            <div className="mb-4 p-4 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-[#10b981] flex items-start">
              <p className="text-sm font-bold">Configuration saved successfully!</p>
            </div>
          )}

          <div className="mb-6">
            <h3 className="text-sm font-extrabold text-foreground mb-3">Configured Locations ({locations.length})</h3>

            {locations.length === 0 ? (
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-foreground">
                <p className="text-sm">No storage locations configured. Add a location to enable template synchronization.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {locations.map((location) => (
                  <div 
                    key={location.id} 
                    className={`flex flex-col sm:flex-row gap-4 justify-between p-4 border rounded-xl transition-all ${
                      location.isHidden ? 'bg-muted/10 border-border opacity-70' : 'bg-card border-border/50 hover:border-border hover:shadow-sm'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <FolderOpen size={16} className={location.isHidden ? "text-muted-foreground" : "text-primary"} />
                        <span className={`text-sm font-bold text-foreground ${location.isHidden ? 'line-through' : ''}`}>{location.name}</span>
                        {location.isDefault && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground tracking-wider uppercase">Default</span>
                        )}
                        {location.isHidden && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-input text-muted-foreground tracking-wider uppercase">Hidden</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground font-mono break-all">{location.path}</p>
                      {location.description && (
                        <p className="text-xs text-muted-foreground mt-1 font-medium">{location.description}</p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleToggleVisibility(location.id)} 
                        title={location.isHidden ? "Show" : "Hide"}
                        className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
                      >
                        {location.isHidden ? <VisibilityOffIcon size={18} /> : <VisibilityIcon size={18} />}
                      </button>
                      
                      <button 
                        onClick={() => handleSetDefault(location.id)} 
                        disabled={location.isDefault || location.isHidden}
                        title={location.isDefault ? "Default location" : "Set as default"}
                        className={`p-2 rounded-lg transition-colors ${
                          location.isDefault 
                            ? 'text-primary' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50'
                        }`}
                      >
                        <StarIcon size={18} fill={location.isDefault ? "currentColor" : "none"} />
                      </button>
                      
                      <button 
                        onClick={() => handleRemoveLocation(location.id)}
                        title="Remove location"
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <DeleteIcon size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex justify-center items-center gap-2 px-4 py-3 text-sm font-bold border-2 border-input bg-background hover:bg-muted text-foreground rounded-xl transition-all active:scale-95"
            >
              <AddIcon size={18} strokeWidth={2.5} /> Add New Location
            </button>
          ) : (
            <div className="p-5 border border-border/50 bg-muted/10 rounded-xl space-y-4">
              <h3 className="text-sm font-extrabold text-foreground">Add New Location</h3>
              
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Location Name</label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g., Project Templates"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Directory Path</label>
                <input
                  type="text"
                  value={newLocationPath}
                  onChange={(e) => setNewLocationPath(e.target.value)}
                  placeholder="/Users/your-name/Documents/templates"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none"
                />
                <p className="text-[11px] text-muted-foreground mt-1.5 font-medium ml-1">Must be an absolute path (starting with /)</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newLocationDescription}
                  onChange={(e) => setNewLocationDescription(e.target.value)}
                  placeholder="Additional notes about this location"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border-2 border-input bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 text-foreground transition-all outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddLocation}
                  className="flex-1 px-4 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm"
                >
                  Add Location
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewLocationName("");
                    setNewLocationPath("");
                    setNewLocationDescription("");
                    setError(null);
                  }}
                  className="flex-1 px-4 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/10">
          <button onClick={handleClose} className="px-5 py-2.5 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-all">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={visibleLocations.length === 0}
            className="px-5 py-2.5 text-sm font-bold bg-primary hover:brightness-110 text-primary-foreground rounded-xl transition-all shadow-sm disabled:opacity-50"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
