/**
 * House Buying Records - Main JavaScript
 * Interactive checklist with local storage persistence
 */

// ========================================
// Constants
// ========================================

const STORAGE_KEY = 'houseBuyingRecords';
const THEME_KEY = 'houseBuyingTheme';
const NOTES_KEY = 'houseBuyingNotes';
const COLLAPSED_KEY = 'houseBuyingCollapsed';
const STRUCTURE_KEY = 'houseBuyingStructure';

// ========================================
// State Management
// ========================================

/**
 * Application state manager
 */
const AppState = {
  checkedItems: new Set(),
  notes: {},
  collapsedSections: new Set(),
  structure: {}, // Stores the full checklists structure

  /**
   * Loads state from localStorage
   */
  load() {
    try {
      // Load checked items
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.checkedItems = new Set(parsed.checkedItems || []);
      }

      // Load notes
      const savedNotes = localStorage.getItem(NOTES_KEY);
      if (savedNotes) {
        this.notes = JSON.parse(savedNotes);
      }

      // Load collapsed sections
      const savedCollapsed = localStorage.getItem(COLLAPSED_KEY);
      if (savedCollapsed) {
        this.collapsedSections = new Set(JSON.parse(savedCollapsed));
      }

      // Load structure or init with default
      const savedStructure = localStorage.getItem(STRUCTURE_KEY);
      if (savedStructure) {
        this.structure = JSON.parse(savedStructure);
      } else {
        // Deep copy default data if no saved structure
        this.structure = JSON.parse(JSON.stringify(checklistData));
        this.saveStructure();
      }
    } catch (error) {
      console.error('Failed to load state:', error);
      // Fallback
      this.structure = JSON.parse(JSON.stringify(checklistData));
    }
  },

  /**
   * Saves checklist structure
   */
  saveStructure() {
    try {
      localStorage.setItem(STRUCTURE_KEY, JSON.stringify(this.structure));
    } catch (error) {
      console.error('Failed to save structure:', error);
    }
  },

  /**
   * Saves checked items to localStorage
   */
  saveCheckedItems() {
    try {
      const data = {
        checkedItems: Array.from(this.checkedItems),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save checked items:', error);
    }
  },

  /**
   * Saves notes to localStorage
   */
  saveNotes() {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(this.notes));
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  },

  /**
   * Saves collapsed sections to localStorage
   */
  saveCollapsed() {
    try {
      localStorage.setItem(COLLAPSED_KEY, JSON.stringify(Array.from(this.collapsedSections)));
    } catch (error) {
      console.error('Failed to save collapsed state:', error);
    }
  },

  /**
   * Gets structure for a section
   */
  getSectionStructure(sectionKey) {
    if (!this.structure[sectionKey]) { // Fallback if key missing
      this.structure[sectionKey] = JSON.parse(JSON.stringify(checklistData[sectionKey] || []));
    }
    return this.structure[sectionKey];
  },

  /**
   * Adds a new item to a subsection
   */
  addItem(sectionKey, subsectionIndex) {
    const newItem = {
      id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      text: '新項目',
      description: '點擊編輯按鈕修改內容'
    };

    if (this.structure[sectionKey] && this.structure[sectionKey][subsectionIndex]) {
      this.structure[sectionKey][subsectionIndex].items.push(newItem);
      this.saveStructure();
      return newItem;
    }
    return null;
  },

  /**
   * Deletes an item
   */
  deleteItem(sectionKey, subsectionIndex, itemId) {
    if (this.structure[sectionKey] && this.structure[sectionKey][subsectionIndex]) {
      const items = this.structure[sectionKey][subsectionIndex].items;
      this.structure[sectionKey][subsectionIndex].items = items.filter(item => item.id !== itemId);

      // Also remove checked state if exists
      // Note: itemId in checkedItems is prefixed with sectionKey usually in UI logic
      // verification needed on how itemId is stored in checkedItems vs structure

      this.saveStructure();
      return true;
    }
    return false;
  },

  /**
   * Updates an item's content
   */
  updateItemContent(sectionKey, subsectionIndex, itemId, text, description) {
    if (this.structure[sectionKey] && this.structure[sectionKey][subsectionIndex]) {
      const item = this.structure[sectionKey][subsectionIndex].items.find(i => i.id === itemId);
      if (item) {
        item.text = text;
        item.description = description;
        this.saveStructure();
        return true;
      }
    }
    return false;
  },

  /**
   * Adds a new subsection (category)
   */
  addSubsection(sectionKey) {
    const newSubsection = {
      title: '新分類',
      icon: '📌',
      items: []
    };

    if (this.structure[sectionKey]) {
      this.structure[sectionKey].push(newSubsection);
      this.saveStructure();
      return this.structure[sectionKey].length - 1; // Return new index
    }
    return -1;
  },

  /**
   * Deletes a subsection (category)
   */
  deleteSubsection(sectionKey, subsectionIndex) {
    if (this.structure[sectionKey] && this.structure[sectionKey][subsectionIndex]) {
      // Remove all checked items belonging to this subsection
      const subsection = this.structure[sectionKey][subsectionIndex];
      subsection.items.forEach(item => {
        this.checkedItems.delete(item.id);
      });
      this.saveCheckedItems();

      // Remove subsection
      this.structure[sectionKey].splice(subsectionIndex, 1);
      this.saveStructure();
      return true;
    }
    return false;
  },

  /**
   * Updates a subsection's title and icon
   */
  updateSubsection(sectionKey, subsectionIndex, title, icon) {
    if (this.structure[sectionKey] && this.structure[sectionKey][subsectionIndex]) {
      this.structure[sectionKey][subsectionIndex].title = title;
      this.structure[sectionKey][subsectionIndex].icon = icon || '📌';
      this.saveStructure();
      return true;
    }
    return false;
  },

  /**
   * Toggles an item's checked state
   * @param {string} itemId - The item identifier (e.g. "viewing-v1")
   * @returns {boolean} - The new checked state
   */
  toggleItem(itemId) {
    if (this.checkedItems.has(itemId)) {
      this.checkedItems.delete(itemId);
    } else {
      this.checkedItems.add(itemId);
    }
    this.saveCheckedItems();
    return this.checkedItems.has(itemId);
  },

  /**
   * Checks if an item is checked
   * @param {string} itemId - The item identifier
   * @returns {boolean}
   */
  isChecked(itemId) {
    return this.checkedItems.has(itemId);
  },

  /**
   * Toggles section collapsed state
   * @param {string} sectionId - Section identifier
   * @returns {boolean} - The new collapsed state
   */
  toggleCollapsed(sectionId) {
    if (this.collapsedSections.has(sectionId)) {
      this.collapsedSections.delete(sectionId);
    } else {
      this.collapsedSections.add(sectionId);
    }
    this.saveCollapsed();
    return this.collapsedSections.has(sectionId);
  },

  /**
   * Checks if a section is collapsed
   * @param {string} sectionId - Section identifier
   * @returns {boolean}
   */
  isCollapsed(sectionId) {
    return this.collapsedSections.has(sectionId);
  },

  /**
   * Adds a note to a section
   * @param {string} sectionId - Section identifier
   * @param {string} text - Note text
   * @returns {Object} - The created note
   */
  addNote(sectionId, text) {
    if (!this.notes[sectionId]) {
      this.notes[sectionId] = [];
    }
    const note = {
      id: Date.now().toString(),
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    this.notes[sectionId].push(note);
    this.saveNotes();
    return note;
  },

  /**
   * Deletes a note from a section
   * @param {string} sectionId - Section identifier
   * @param {string} noteId - Note identifier
   */
  deleteNote(sectionId, noteId) {
    if (this.notes[sectionId]) {
      this.notes[sectionId] = this.notes[sectionId].filter(note => note.id !== noteId);
      this.saveNotes();
    }
  },

  /**
   * Updates a note's text
   * @param {string} sectionId - Section identifier
   * @param {string} noteId - Note identifier
   * @param {string} newText - New note text
   */
  updateNote(sectionId, noteId, newText) {
    if (this.notes[sectionId]) {
      const note = this.notes[sectionId].find(n => n.id === noteId);
      if (note) {
        note.text = newText;
        note.updatedAt = new Date().toISOString();
        this.saveNotes();
      }
    }
  },

  /**
   * Gets notes for a section
   * @param {string} sectionId - Section identifier
   * @returns {Array} - Array of notes
   */
  getNotes(sectionId) {
    return this.notes[sectionId] || [];
  },

  /**
   * Saves custom items to localStorage
   */
  saveCustomItems() {
    try {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify(this.customItems));
    } catch (error) {
      console.error('Failed to save custom items:', error);
    }
  },

  /**
   * Gets custom content for an item
   * @param {string} itemId - Item identifier
   * @returns {Object|null} - Custom content or null
   */
  getCustomItem(itemId) {
    return this.customItems[itemId] || null;
  },

  /**
   * Updates custom content for an item
   * @param {string} itemId - Item identifier
   * @param {string} text - Custom title
   * @param {string} description - Custom description
   */
  updateCustomItem(itemId, text, description) {
    this.customItems[itemId] = { text, description };
    this.saveCustomItems();
  },

  /**
   * Resets an item to default content
   * @param {string} itemId - Item identifier
   */
  resetCustomItem(itemId) {
    delete this.customItems[itemId];
    this.saveCustomItems();
  }
};

// ========================================
// Theme Management
// ========================================

/**
 * Theme manager for dark/light mode
 */
const ThemeManager = {
  /**
   * Initializes theme from localStorage or system preference
   */
  init() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      this.setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light');
    }
  },

  /**
   * Sets the theme
   * @param {string} theme - 'light' or 'dark'
   */
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    this.updateToggleIcon(theme);
  },

  /**
   * Toggles between light and dark themes
   */
  toggle() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  },

  /**
   * Updates the toggle button icon
   * @param {string} theme - Current theme
   */
  updateToggleIcon(theme) {
    const slider = document.querySelector('.theme-toggle__slider');
    if (slider) {
      slider.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }
};

// ========================================
// UI Components
// ========================================

/**
 * Creates a checklist item element
 * @param {Object} item - Item data
 * @param {string} sectionId - Parent section ID
 * @returns {HTMLElement}
 */
/**
 * Creates a checklist item element
 * @param {Object} item - Item data
 * @param {string} sectionKey - Section key
 * @param {number} subsectionIndex - Subsection index
 * @returns {HTMLElement}
 */
function createChecklistItem(item, sectionKey, subsectionIndex) {
  const itemId = item.id;
  const isChecked = AppState.isChecked(itemId);

  const li = document.createElement('li');
  li.className = `checklist__item${isChecked ? ' checklist__item--checked' : ''}`;
  li.dataset.itemId = itemId;
  li.dataset.sectionKey = sectionKey;
  li.dataset.subsectionIndex = subsectionIndex;

  li.innerHTML = `
    <div class="checklist__checkbox">
      <span class="checklist__checkbox-icon">✓</span>
    </div>
    <div class="checklist__content">
      <div class="checklist__text">${escapeHtml(item.text)}</div>
      ${item.description ? `<div class="checklist__description">${parseMarkdown(item.description)}</div>` : ''}
    </div>
    <button class="checklist__edit-btn" aria-label="編輯項目">✎</button>
    <div class="checklist__edit-form">
      <input type="text" class="checklist__edit-input checklist__edit-input--title" placeholder="項目標題" value="${escapeHtml(item.text)}" />
      <textarea class="checklist__edit-textarea" placeholder="描述（支援 Markdown：**粗體** *斜體* \`程式碼\` - 清單）">${escapeHtml(item.description || '')}</textarea>
      <div class="checklist__edit-actions">
        <button type="button" class="checklist__delete-btn">刪除</button>
        <div class="checklist__edit-actions-group">
          <button type="button" class="checklist__edit-cancel">取消</button>
          <button type="button" class="checklist__edit-save">儲存</button>
        </div>
      </div>
    </div>
  `;

  // Handle checkbox click
  const checkbox = li.querySelector('.checklist__checkbox');
  checkbox.addEventListener('click', (e) => {
    e.stopPropagation();
    handleItemClick(li, itemId, sectionKey);
  });

  // Handle edit button click
  const editBtn = li.querySelector('.checklist__edit-btn');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    enterEditMode(li);
  });

  // Handle delete button
  const deleteBtn = li.querySelector('.checklist__delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    const confirmed = window.confirm('確定要刪除「' + item.text + '」嗎？此操作無法復原。');
    if (confirmed) {
      const subIdx = parseInt(subsectionIndex, 10);
      const result = AppState.deleteItem(sectionKey, subIdx, itemId);
      if (result) {
        reRenderSection(sectionKey);
      } else {
        console.error('Failed to delete item:', { sectionKey, subsectionIndex: subIdx, itemId });
      }
    }
  });

  // Handle save button
  const saveBtn = li.querySelector('.checklist__edit-save');
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveItemEdit(li);
  });

  // Handle cancel button
  const cancelBtn = li.querySelector('.checklist__edit-cancel');
  cancelBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    exitEditMode(li);
  });

  // Handle inputs
  const titleInput = li.querySelector('.checklist__edit-input--title');
  const textarea = li.querySelector('.checklist__edit-textarea');

  const handleKeydown = (e) => {
    if (e.key === 'Escape') {
      exitEditMode(li);
    } else if (e.key === 'Enter' && (e.target === titleInput || e.ctrlKey)) {
      e.preventDefault();
      saveItemEdit(li);
    }
  };

  if (titleInput) {
    titleInput.addEventListener('keydown', handleKeydown);
    titleInput.addEventListener('click', (e) => e.stopPropagation());
  }
  if (textarea) {
    textarea.addEventListener('keydown', handleKeydown);
    textarea.addEventListener('click', (e) => e.stopPropagation());
  }

  return li;
}

/**
 * Enters edit mode for a checklist item
 * @param {HTMLElement} li - The list item element
 * @param {string} itemId - Item identifier
 */
/**
 * Enters edit mode for a checklist item
 * @param {HTMLElement} li - The list item element
 */
function enterEditMode(li) {
  li.classList.add('checklist__item--editing');
  const titleInput = li.querySelector('.checklist__edit-input--title');
  if (titleInput) {
    titleInput.focus();
    titleInput.select();
  }
}

/**
 * Exits edit mode without saving
 * @param {HTMLElement} li - The list item element
 */
function exitEditMode(li) {
  li.classList.remove('checklist__item--editing');

  // Revert changes logic: re-render the section from source of truth
  const sectionKey = li.dataset.sectionKey;
  if (sectionKey) {
    reRenderSection(sectionKey);
  }
}

/**
 * Saves the edited content
 * @param {HTMLElement} li - The list item element
 */
function saveItemEdit(li) {
  const titleInput = li.querySelector('.checklist__edit-input--title');
  const descTextarea = li.querySelector('.checklist__edit-textarea');

  const newText = titleInput.value.trim();
  const newDesc = descTextarea.value.trim();

  if (!newText) {
    titleInput.focus();
    return;
  }

  const sectionKey = li.dataset.sectionKey;
  const subsectionIndex = parseInt(li.dataset.subsectionIndex);
  const itemId = li.dataset.itemId;

  if (AppState.updateItemContent(sectionKey, subsectionIndex, itemId, newText, newDesc)) {
    reRenderSection(sectionKey);
  }
}

/**
 * Handles checklist item click
 * @param {HTMLElement} element - The clicked element
 * @param {string} itemId - Item identifier
 * @param {string} sectionKey - Section key
 */
function handleItemClick(element, itemId, sectionKey) {
  const isChecked = AppState.toggleItem(itemId);
  element.classList.toggle('checklist__item--checked', isChecked);
  updateTotalProgress();
  updateSectionProgress(sectionKey);
}

/**
 * Updates progress for a specific section
 * @param {string} sectionKey - Section identifier (e.g. 'viewing')
 */
function updateSectionProgress(sectionKey) {
  // If sectionKey comes in as 'section-viewing', strip prefix
  const key = sectionKey.replace('section-', '');
  const sectionId = `section-${key}`;

  // Calculate progress from structure
  const structure = AppState.getSectionStructure(key);
  let total = 0;
  let checked = 0;

  structure.forEach(subsection => {
    subsection.items.forEach(item => {
      total++;
      if (AppState.isChecked(item.id)) {
        checked++;
      }
    });
  });

  const percentage = total > 0 ? (checked / total) * 100 : 0;

  // Update Bento Card
  const cards = document.querySelectorAll('.bento__item--card');
  cards.forEach(card => {
    if (card.dataset.section === sectionId) {
      const barFill = card.querySelector('.card-bento__bar-fill');
      const stats = card.querySelector('.card-bento__stats');
      if (barFill) barFill.style.width = `${percentage}%`;
      if (stats) stats.textContent = `${checked}/${total}`;
    }
  });
}

/**
 * Helper to re-render a section after changes
 */
function reRenderSection(sectionKey) {
  const sectionId = `section-${sectionKey}`;
  initializeSection(sectionId, sectionKey);
}

/**
 * Simple Markdown parser for notes
 * Supports: **bold**, *italic*, `code`, [links](url), - lists, > quotes
 * @param {string} text - Markdown text
 * @returns {string} - HTML output
 */
function parseMarkdown(text) {
  if (!text) return '';

  let html = escapeHtml(text);

  // Code blocks (inline)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  // Line breaks
  html = html.replace(/\n/g, '<br>');

  // Lists (simple - at start of line after break or start)
  html = html.replace(/(^|<br>)- (.+?)(?=<br>|$)/g, '$1<span class="md-list-item">• $2</span>');

  // Quotes (> at start)
  html = html.replace(/(^|<br>)&gt; (.+?)(?=<br>|$)/g, '$1<blockquote class="md-quote">$2</blockquote>');

  return html;
}

/**
 * Creates a note item element with Markdown support and edit functionality
 * @param {Object} note - Note data
 * @param {string} sectionId - Section identifier
 * @returns {HTMLElement}
 */
function createNoteItem(note, sectionId) {
  const li = document.createElement('li');
  li.className = 'note-item';
  li.dataset.noteId = note.id;

  const createdDate = new Date(note.createdAt);
  const formattedDate = createdDate.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  li.innerHTML = `
    <div class="note-item__content">
      <div class="note-item__text">${parseMarkdown(note.text)}</div>
      <div class="note-item__time">${formattedDate}</div>
    </div>
    <div class="note-item__edit-form">
      <textarea class="note-item__textarea" placeholder="支援 Markdown：**粗體** *斜體* \`程式碼\` [連結](url)">${escapeHtml(note.text)}</textarea>
      <div class="note-item__edit-actions">
        <button type="button" class="note-item__edit-cancel">取消</button>
        <button type="button" class="note-item__edit-save">儲存</button>
      </div>
    </div>
    <div class="note-item__actions">
      <button class="note-item__edit" aria-label="編輯註記">✎</button>
      <button class="note-item__delete" aria-label="刪除註記">✕</button>
    </div>
  `;

  // Store original text for cancel
  li.dataset.originalText = note.text;

  // Handle edit button
  const editButton = li.querySelector('.note-item__edit');
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    enterNoteEditMode(li);
  });

  // Handle delete button
  const deleteButton = li.querySelector('.note-item__delete');
  deleteButton.addEventListener('click', (e) => {
    e.stopPropagation();
    AppState.deleteNote(sectionId, note.id);
    li.remove();
    updateNotesEmptyState(sectionId);
  });

  // Handle save button
  const saveButton = li.querySelector('.note-item__edit-save');
  saveButton.addEventListener('click', (e) => {
    e.stopPropagation();
    saveNoteEdit(li, sectionId, note.id);
  });

  // Handle cancel button
  const cancelButton = li.querySelector('.note-item__edit-cancel');
  cancelButton.addEventListener('click', (e) => {
    e.stopPropagation();
    exitNoteEditMode(li);
  });

  // Handle Escape key in textarea
  const textarea = li.querySelector('.note-item__textarea');
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      exitNoteEditMode(li);
    }
    // Ctrl+Enter to save
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      saveNoteEdit(li, sectionId, note.id);
    }
  });

  return li;
}

/**
 * Enters edit mode for a note
 * @param {HTMLElement} li - Note item element
 */
function enterNoteEditMode(li) {
  li.classList.add('note-item--editing');
  const textarea = li.querySelector('.note-item__textarea');
  if (textarea) {
    textarea.focus();
    // Move cursor to end
    textarea.selectionStart = textarea.value.length;
    textarea.selectionEnd = textarea.value.length;
  }
}

/**
 * Exits note edit mode without saving
 * @param {HTMLElement} li - Note item element
 */
function exitNoteEditMode(li) {
  li.classList.remove('note-item--editing');
  const textarea = li.querySelector('.note-item__textarea');
  if (textarea && li.dataset.originalText) {
    textarea.value = li.dataset.originalText;
  }
}

/**
 * Saves note edit
 * @param {HTMLElement} li - Note item element
 * @param {string} sectionId - Section identifier
 * @param {string} noteId - Note identifier
 */
function saveNoteEdit(li, sectionId, noteId) {
  const textarea = li.querySelector('.note-item__textarea');
  const newText = textarea.value.trim();

  if (!newText) {
    textarea.focus();
    return;
  }

  // Update in state
  AppState.updateNote(sectionId, noteId, newText);

  // Update display
  const textEl = li.querySelector('.note-item__text');
  textEl.innerHTML = parseMarkdown(newText);

  // Update original text for future cancels
  li.dataset.originalText = newText;

  // Exit edit mode
  li.classList.remove('note-item--editing');
}

/**
 * Escapes HTML special characters
 * @param {string} text - Text to escape
 * @returns {string}
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Updates the empty state for notes
 * @param {string} sectionId - Section identifier
 */
function updateNotesEmptyState(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const notesList = section.querySelector('.notes-list');
  const notes = AppState.getNotes(sectionId);

  if (!notesList) return;

  const existingEmpty = notesList.querySelector('.notes-list__empty');

  if (notes.length === 0 && !existingEmpty) {
    const emptyEl = document.createElement('li');
    emptyEl.className = 'notes-list__empty';
    emptyEl.textContent = '尚無註記，在上方輸入新增...';
    notesList.appendChild(emptyEl);
  } else if (notes.length > 0 && existingEmpty) {
    existingEmpty.remove();
  }
}

/**
 * Creates my insights section from notes.js file
 * @param {string} sectionId - Section identifier
 * @returns {HTMLElement|null}
 */
function createMyInsightsSection(sectionId) {
  // Check if notes.js is loaded and has notes for this section
  if (typeof myNotes === 'undefined' || !myNotes[sectionId]) {
    return null;
  }

  const notes = myNotes[sectionId];
  if (!notes || notes.length === 0) {
    return null;
  }

  const insightsSection = document.createElement('div');
  insightsSection.className = 'insights-section';

  // Create magazine-style header
  const header = document.createElement('div');
  header.className = 'insights-section__header';
  header.innerHTML = `
    <div class="insights-section__masthead">
      <span class="insights-section__label">PERSONAL INSIGHTS</span>
      <h3 class="insights-section__title">MY NOTES</h3>
      <div class="insights-section__divider"></div>
    </div>
    <span class="insights-section__edit-hint">✎ notes.js</span>
  `;
  insightsSection.appendChild(header);

  // Create notes grid
  const notesGrid = document.createElement('div');
  notesGrid.className = 'insights-grid';

  notes.forEach((note, index) => {
    const article = document.createElement('article');

    // Determine style class
    if (note.featured) {
      article.className = 'insight-card insight-card--featured';
    } else if (note.quote) {
      article.className = 'insight-card insight-card--quote';
    } else {
      article.className = 'insight-card';
    }

    // Create inner content
    let contentHTML = '';

    if (note.featured) {
      // Featured style - large hero text
      contentHTML = `
        <div class="insight-card__featured-badge">FEATURED</div>
        <h4 class="insight-card__title insight-card__title--featured">${note.title}</h4>
        <p class="insight-card__text insight-card__text--featured">${Array.isArray(note.content) ? note.content.join(' ') : note.content}</p>
      `;
    } else if (note.quote) {
      // Quote style - editorial pull quote
      contentHTML = `
        <div class="insight-card__quote-mark">"</div>
        <blockquote class="insight-card__blockquote">${Array.isArray(note.content) ? note.content.join(' ') : note.content}</blockquote>
        <cite class="insight-card__cite">— ${note.title}</cite>
      `;
    } else {
      // Standard style
      let bodyContent = '';
      if (Array.isArray(note.content)) {
        bodyContent = note.content.map(line => {
          if (line === '') return '<div class="insight-card__spacer"></div>';
          return `<p class="insight-card__line">${line}</p>`;
        }).join('');
      } else {
        bodyContent = `<p class="insight-card__line">${note.content}</p>`;
      }

      contentHTML = `
        <span class="insight-card__number">${String(index + 1).padStart(2, '0')}</span>
        <h4 class="insight-card__title">${note.title}</h4>
        <div class="insight-card__body">${bodyContent}</div>
      `;
    }

    article.innerHTML = contentHTML;
    notesGrid.appendChild(article);
  });

  insightsSection.appendChild(notesGrid);
  return insightsSection;
}

/**
 * Creates a notes section element
 * @param {string} sectionId - Section identifier
 * @returns {HTMLElement}
 */
function createNotesSection(sectionId) {
  const notesSection = document.createElement('div');
  notesSection.className = 'notes-section';

  notesSection.innerHTML = `
    <div class="notes-section__header">
      <h4 class="notes-section__title">
        <span class="notes-section__title-icon">📝</span>
        我的註記
      </h4>
    </div>
    <form class="note-form">
      <input type="text" class="note-form__input" placeholder="輸入註記內容..." />
      <button type="submit" class="note-form__button">新增</button>
    </form>
    <ul class="notes-list"></ul>
  `;

  const form = notesSection.querySelector('.note-form');
  const input = notesSection.querySelector('.note-form__input');
  const notesList = notesSection.querySelector('.notes-list');

  // Load existing notes
  const existingNotes = AppState.getNotes(sectionId);
  existingNotes.forEach(note => {
    notesList.appendChild(createNoteItem(note, sectionId));
  });

  // Add empty state if no notes
  if (existingNotes.length === 0) {
    const emptyEl = document.createElement('li');
    emptyEl.className = 'notes-list__empty';
    emptyEl.textContent = '尚無註記，在上方輸入新增...';
    notesList.appendChild(emptyEl);
  }

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text) {
      const note = AppState.addNote(sectionId, text);

      // Remove empty state if exists
      const emptyEl = notesList.querySelector('.notes-list__empty');
      if (emptyEl) {
        emptyEl.remove();
      }

      notesList.appendChild(createNoteItem(note, sectionId));
      input.value = '';
    }
  });

  return notesSection;
}

/**
 * Initializes a section with checklist data
 * @param {string} sectionId - Section identifier
 * @param {Array} subsections - Array of subsection data
 */
/**
 * Initializes a checklist section
 * @param {string} sectionId - Section identifier
 * @param {string} sectionKey - Section key (e.g. 'viewing')
 */
function initializeSection(sectionId, sectionKey) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const content = section.querySelector('.section__content');
  if (!content) return;

  // Clear existing content
  content.innerHTML = '';

  // Add insights section from notes.js file (if exists)
  const insightsSection = createMyInsightsSection(sectionId);
  if (insightsSection) {
    content.appendChild(insightsSection);
  }

  // Add notes section for dynamic user notes
  content.appendChild(createNotesSection(sectionId));

  // Get data from AppState
  const subsections = AppState.getSectionStructure(sectionKey);

  // Add subsections
  subsections.forEach((subsection, index) => {
    createSubsection(content, subsection, sectionKey, index);
  });

  // Add "Add Subsection" button
  const addSubsectionBtn = document.createElement('button');
  addSubsectionBtn.className = 'btn-add-subsection';
  addSubsectionBtn.innerHTML = '+ 新增分類';
  addSubsectionBtn.addEventListener('click', () => {
    const newIndex = AppState.addSubsection(sectionKey);
    if (newIndex >= 0) {
      reRenderSection(sectionKey);
      // Auto enter edit mode for the new subsection
      setTimeout(() => {
        const newSubsection = content.querySelector(`.subsection[data-subsection-index="${newIndex}"]`);
        if (newSubsection) {
          newSubsection.classList.add('subsection--editing');
          newSubsection.querySelector('.subsection__edit-title').focus();
        }
      }, 50);
    }
  });
  content.appendChild(addSubsectionBtn);

  // Update progress
  updateSectionProgress(sectionKey);

  // Setup collapse functionality
  setupSectionCollapse(sectionId);
}

/**
 * Creates a subsection with items and add button
 */
function createSubsection(container, subsection, sectionKey, subsectionIndex) {
  const subsectionEl = document.createElement('div');
  subsectionEl.className = 'subsection';
  subsectionEl.dataset.sectionKey = sectionKey;
  subsectionEl.dataset.subsectionIndex = subsectionIndex;

  const ul = document.createElement('ul');
  ul.className = 'checklist';

  subsection.items.forEach(item => {
    ul.appendChild(createChecklistItem(item, sectionKey, subsectionIndex));
  });

  // Create header with edit/delete buttons
  const headerEl = document.createElement('div');
  headerEl.className = 'subsection__header';
  headerEl.innerHTML = `
    <h3 class="subsection__title">
      <span class="subsection__title-icon">${subsection.icon || '📌'}</span>
      <span class="subsection__title-text">${subsection.title}</span>
    </h3>
    <div class="subsection__actions">
      <button class="subsection__edit-btn" title="編輯分類">✎</button>
      <button class="subsection__delete-btn" title="刪除分類">✕</button>
    </div>
  `;

  // Edit form (hidden by default)
  const editFormEl = document.createElement('div');
  editFormEl.className = 'subsection__edit-form';
  editFormEl.innerHTML = `
    <input type="text" class="subsection__edit-icon" placeholder="圖示" value="${subsection.icon || '📌'}" maxlength="2" />
    <input type="text" class="subsection__edit-title" placeholder="分類名稱" value="${subsection.title}" />
    <div class="subsection__edit-actions">
      <button type="button" class="subsection__edit-cancel">取消</button>
      <button type="button" class="subsection__edit-save">儲存</button>
    </div>
  `;

  subsectionEl.appendChild(headerEl);
  subsectionEl.appendChild(editFormEl);
  subsectionEl.appendChild(ul);

  // Handle edit button
  const editBtn = headerEl.querySelector('.subsection__edit-btn');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    subsectionEl.classList.add('subsection--editing');
    editFormEl.querySelector('.subsection__edit-title').focus();
  });

  // Handle delete button
  const deleteBtn = headerEl.querySelector('.subsection__delete-btn');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`確定要刪除「${subsection.title}」分類及其所有項目嗎？`)) {
      AppState.deleteSubsection(sectionKey, subsectionIndex);
      reRenderSection(sectionKey);
      updateTotalProgress();
    }
  });

  // Handle save
  const saveBtn = editFormEl.querySelector('.subsection__edit-save');
  saveBtn.addEventListener('click', () => {
    const newIcon = editFormEl.querySelector('.subsection__edit-icon').value.trim() || '📌';
    const newTitle = editFormEl.querySelector('.subsection__edit-title').value.trim();
    if (newTitle) {
      AppState.updateSubsection(sectionKey, subsectionIndex, newTitle, newIcon);
      reRenderSection(sectionKey);
    }
  });

  // Handle cancel
  const cancelBtn = editFormEl.querySelector('.subsection__edit-cancel');
  cancelBtn.addEventListener('click', () => {
    subsectionEl.classList.remove('subsection--editing');
  });

  // Add "Add Item" button
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add-item';
  addBtn.textContent = '+ 新增項目';
  addBtn.addEventListener('click', () => {
    const newItem = AppState.addItem(sectionKey, subsectionIndex);
    if (newItem) {
      reRenderSection(sectionKey);
      setTimeout(() => {
        const newItemEl = document.querySelector(`li[data-item-id="${newItem.id}"]`);
        if (newItemEl) {
          enterEditMode(newItemEl);
        }
      }, 50);
      updateTotalProgress();
    }
  });

  subsectionEl.appendChild(addBtn);
  container.appendChild(subsectionEl);
}

/**
 * Sets up collapse functionality for a section
 * @param {string} sectionId - Section identifier
 */
function setupSectionCollapse(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const header = section.querySelector('.section__header');
  if (!header) return;

  // Apply initial collapsed state
  if (AppState.isCollapsed(sectionId)) {
    section.classList.add('section--collapsed');
  }

  // Handle click
  header.addEventListener('click', () => {
    const isCollapsed = AppState.toggleCollapsed(sectionId);
    section.classList.toggle('section--collapsed', isCollapsed);
  });
}

// ========================================
// Checklist Data
// ========================================

const checklistData = {
  viewing: [
    {
      title: '環境與社區',
      icon: '🏘️',
      items: [
        { id: 'v1', text: '交通便利性', description: '評估公車站、捷運站、主要道路的距離' },
        { id: 'v2', text: '生活機能', description: '附近是否有市場、超市、便利商店、醫療機構' },
        { id: 'v3', text: '社區品質', description: '公設維護狀況、電梯保養、逃生梯是否清潔暢通' },
        { id: 'v4', text: '管理費運用', description: '確認管理費包含項目及運用情形' },
        { id: 'v5', text: '入住率', description: '社區入住率高低，影響管理品質' },
        { id: 'v6', text: '鄰里環境', description: '街道寬度、停車便利性' },
        { id: 'v7', text: '嫌惡設施', description: '檢查周邊是否有墓地、焚化爐、高壓電塔等' },
        { id: 'v8', text: '管委會運作', description: '確認社區是否有管委會及運作狀況' }
      ]
    },
    {
      title: '房屋內部',
      icon: '🏠',
      items: [
        { id: 'v9', text: '格局方正', description: '確認房屋格局是否方正、有無暗房' },
        { id: 'v10', text: '採光通風', description: '建議不同時段看房，觀察採光與通風' },
        { id: 'v11', text: '牆壁檢查', description: '檢查壁癌、裂縫、傾斜情況' },
        { id: 'v12', text: '天花板', description: '確認有無水漬、龜裂' },
        { id: 'v13', text: '地板平整', description: '可用彈珠或水平尺測試' },
        { id: 'v14', text: '水壓測試', description: '開啟水龍頭測試水壓是否正常' },
        { id: 'v15', text: '電路檢查', description: '電箱管線狀況、所有插座是否通電' },
        { id: 'v16', text: '門窗密合', description: '窗框是否密合、開關是否順暢' },
        { id: 'v17', text: '特殊屋況', description: '查詢是否為輻射屋、海砂屋、事故屋' },
        { id: 'v18', text: '隔音效果', description: '測試牆壁隔音效果' },
        { id: 'v19', text: '西曬問題', description: '下午時段確認是否有西曬問題' },
        { id: 'v20', text: '漏水檢查', description: '建議雨天看房，檢查滲水問題' }
      ]
    }
  ],
  buying: [
    {
      title: '財務評估',
      icon: '💵',
      items: [
        { id: 'b1', text: '頭期款準備', description: '確認自備款金額是否充足' },
        { id: 'b2', text: '月付款能力', description: '每月房貸建議不超過月收入 30%' },
        { id: 'b3', text: '仲介費預算', description: '通常為成交價的 1-2%' },
        { id: 'b4', text: '代書費', description: '過戶費用約 1-2 萬元' },
        { id: 'b5', text: '契稅', description: '房屋評定現值的 6%' },
        { id: 'b6', text: '印花稅', description: '公契價格的 0.1%' },
        { id: 'b7', text: '裝修預算', description: '預估裝潢與家具費用' }
      ]
    },
    {
      title: '法律與文件',
      icon: '📋',
      items: [
        { id: 'b8', text: '產權確認', description: '查詢地籍謄本確認產權清楚' },
        { id: 'b9', text: '抵押查封', description: '確認無抵押權或查封' },
        { id: 'b10', text: '合約審閱', description: '詳細閱讀買賣合約所有條款' },
        { id: 'b11', text: '附贈物品', description: '確認合約中附贈的家電、傢俱' },
        { id: 'b12', text: '土地分區', description: '確認土地使用分區' },
        { id: 'b13', text: '建物登記', description: '核對建物登記資料' }
      ]
    },
    {
      title: '議價與簽約',
      icon: '🤝',
      items: [
        { id: 'b14', text: '實價登錄查詢', description: '查詢周邊成交行情' },
        { id: 'b15', text: '議價底線', description: '設定議價策略與底線' },
        { id: 'b16', text: '簽約條款', description: '確認所有條款再簽約' },
        { id: 'b17', text: '訂金比例', description: '確認訂金/簽約金比例（通常 10%）' },
        { id: 'b18', text: '付款時程', description: '確認分期付款時程' }
      ]
    }
  ],
  handover: [
    {
      title: '驗屋準備',
      icon: '📦',
      items: [
        { id: 'h1', text: '合約權狀', description: '備妥合約、權狀、平面圖' },
        { id: 'h2', text: '驗屋工具', description: '手電筒、水平尺、小夜燈、捲尺' },
        { id: 'h3', text: '驗屋時間', description: '預留充足時間進行驗收' }
      ]
    },
    {
      title: '結構與外觀',
      icon: '🧱',
      items: [
        { id: 'h4', text: '牆面檢查', description: '檢查平整度、裂縫' },
        { id: 'h5', text: '磁磚空鼓', description: '用硬幣敲擊測試是否空心' },
        { id: 'h6', text: '天花板', description: '檢查漏水、龜裂情況' },
        { id: 'h7', text: '油漆品質', description: '確認油漆是否均勻無脫落' }
      ]
    },
    {
      title: '門窗驗收',
      icon: '🚪',
      items: [
        { id: 'h8', text: '開關順暢', description: '所有門窗開關是否順暢' },
        { id: 'h9', text: '密合度', description: '門窗是否密合無縫隙' },
        { id: 'h10', text: '玻璃完整', description: '檢查玻璃有無刮傷、破損' },
        { id: 'h11', text: '紗窗蚊網', description: '確認紗窗完整無破損' }
      ]
    },
    {
      title: '水電驗收',
      icon: '🔌',
      items: [
        { id: 'h12', text: '水壓測試', description: '全屋水龍頭同時開啟測試' },
        { id: 'h13', text: '排水通暢', description: '測試所有排水孔' },
        { id: 'h14', text: '馬桶功能', description: '沖水是否正常、有無漏水' },
        { id: 'h15', text: '插座測試', description: '用小夜燈測試所有插座' },
        { id: 'h16', text: '開關功能', description: '測試所有電燈開關' },
        { id: 'h17', text: '網路電視', description: '測試網路孔、電視訊號孔' }
      ]
    },
    {
      title: '防水驗收',
      icon: '💧',
      items: [
        { id: 'h18', text: '浴室防水', description: '確認無滲水現象' },
        { id: 'h19', text: '陽台防水', description: '檢查陽台排水與防水' },
        { id: 'h20', text: '窗框滲水', description: '確認窗戶周邊無滲水' },
        { id: 'h21', text: '排水坡度', description: '確認地板排水坡度足夠' }
      ]
    },
    {
      title: '行政驗收',
      icon: '📝',
      items: [
        { id: 'h22', text: '坪數核對', description: '權狀坪數與合約是否一致' },
        { id: 'h23', text: '保固書', description: '確認保固起算日期' },
        { id: 'h24', text: '費用結算', description: '水電費、管理費結算' },
        { id: 'h25', text: '交屋保留款', description: '預留 5% 直到問題修復' },
        { id: 'h26', text: '鑰匙點交', description: '確認所有鑰匙數量' }
      ]
    }
  ],
  loan: [
    {
      title: '申請前準備',
      icon: '📄',
      items: [
        { id: 'l1', text: '信用查詢', description: '查詢聯徵紀錄確認信用狀況' },
        { id: 'l2', text: '身分證明', description: '身分證、第二證件影本' },
        { id: 'l3', text: '戶籍謄本', description: '戶口名簿影本或戶籍謄本' },
        { id: 'l4', text: '薪資證明', description: '薪資單、薪轉存摺' },
        { id: 'l5', text: '報稅證明', description: '扣繳憑單、所得稅申報' },
        { id: 'l6', text: '不動產文件', description: '買賣合約、土地建物謄本' }
      ]
    },
    {
      title: '貸款比較',
      icon: '📊',
      items: [
        { id: 'l7', text: '利率比較', description: '比較各銀行房貸利率' },
        { id: 'l8', text: '利率類型', description: '固定利率 vs 機動利率' },
        { id: 'l9', text: '貸款成數', description: '確認可貸成數（通常 70-80%）' },
        { id: 'l10', text: '寬限期', description: '了解寬限期條件與限制' },
        { id: 'l11', text: '還款年限', description: '評估 20 年或 30 年' },
        { id: 'l12', text: '違約金', description: '確認提前還款違約金' }
      ]
    },
    {
      title: '貸款流程',
      icon: '📋',
      items: [
        { id: 'l13', text: '提出申請', description: '向銀行提交貸款申請' },
        { id: 'l14', text: '房屋鑑價', description: '銀行進行房屋估價' },
        { id: 'l15', text: '審核核准', description: '等待銀行審核結果' },
        { id: 'l16', text: '簽約對保', description: '確認貸款金額、利率、還款方式' },
        { id: 'l17', text: '抵押設定', description: '辦理不動產抵押權設定' },
        { id: 'l18', text: '火險地震險', description: '投保住宅火險與地震險' },
        { id: 'l19', text: '撥款', description: '確認撥款至指定帳戶' }
      ]
    },
    {
      title: '政府優惠',
      icon: '🏛️',
      items: [
        { id: 'l20', text: '青年安心成家', description: '評估是否符合申請資格' },
        { id: 'l21', text: '利息補貼', description: '自購住宅貸款利息補貼' },
        { id: 'l22', text: '首購優惠', description: '各銀行首購優惠方案' }
      ]
    }
  ]
};

// ========================================
// Navigation
// ========================================

/**
 * Sets up smooth scroll for progress cards
 */
function setupNavigation() {
  const progressCards = document.querySelectorAll('.progress-card');
  progressCards.forEach(card => {
    card.addEventListener('click', () => {
      const sectionId = card.dataset.section;
      navigateToSection(sectionId);
    });
  });
}

/**
 * Sets up side navigation
 */
function setupSideNav() {
  const sidenavItems = document.querySelectorAll('.sidenav__item');

  sidenavItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      navigateToSection(sectionId);

      // Update active state
      sidenavItems.forEach(i => i.classList.remove('sidenav__item--active'));
      item.classList.add('sidenav__item--active');

      // Close mobile menu
      const sidenav = document.getElementById('sidenav');
      sidenav.classList.remove('sidenav--open');
    });
  });

  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const sidenav = document.getElementById('sidenav');

  if (menuToggle && sidenav) {
    menuToggle.addEventListener('click', () => {
      sidenav.classList.toggle('sidenav--open');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!sidenav.contains(e.target) && !menuToggle.contains(e.target)) {
        sidenav.classList.remove('sidenav--open');
      }
    });
  }

  // Update active nav on scroll
  window.addEventListener('scroll', updateActiveNav);
}

/**
 * Updates active nav item based on scroll position
 */
function updateActiveNav() {
  const sections = document.querySelectorAll('.section');
  const sidenavItems = document.querySelectorAll('.sidenav__item');

  let currentSection = '';

  sections.forEach(section => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= 200) {
      currentSection = section.id;
    }
  });

  sidenavItems.forEach(item => {
    item.classList.remove('sidenav__item--active');
    if (item.dataset.section === currentSection) {
      item.classList.add('sidenav__item--active');
    }
  });
}

/**
 * Navigates to a section
 */
function navigateToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (section) {
    // Expand section if collapsed
    if (AppState.isCollapsed(sectionId)) {
      AppState.toggleCollapsed(sectionId);
      section.classList.remove('section--collapsed');
    }
    section.scrollIntoView({ behavior: 'smooth' });
  }
}
/**
 * Updates total progress in hero section
 */
function updateTotalProgress() {
  const allItems = document.querySelectorAll('.checklist__item');
  const checkedItems = document.querySelectorAll('.checklist__item--checked');

  const total = allItems.length;
  const checked = checkedItems.length;
  const remaining = total - checked;
  const percentage = total > 0 ? Math.round((checked / total) * 100) : 0;

  // Update stat numbers
  const progressEl = document.getElementById('total-progress-num');
  const itemsEl = document.getElementById('total-items-num');
  const completedEl = document.getElementById('completed-items-num');
  const remainingEl = document.getElementById('remaining-items-num');

  if (progressEl) progressEl.textContent = percentage;
  if (itemsEl) itemsEl.textContent = total;
  if (completedEl) completedEl.textContent = checked;
  if (remainingEl) remainingEl.textContent = remaining;

  // Update progress ring
  const progressRing = document.getElementById('progress-ring');
  if (progressRing) {
    const circumference = 2 * Math.PI * 45; // radius = 45
    const offset = circumference - (percentage / 100) * circumference;
    progressRing.style.strokeDashoffset = offset;
  }
}

/**
 * Sets up top navigation menu
 */
function setupTopNav() {
  const navItems = document.querySelectorAll('.nav__item');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      navigateToSection(sectionId);

      // Update active state
      navItems.forEach(i => i.classList.remove('nav__item--active'));
      item.classList.add('nav__item--active');
    });
  });

  // Update active nav on scroll
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    let currentSection = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 150) {
        currentSection = section.id;
      }
    });

    navItems.forEach(item => {
      item.classList.remove('nav__item--active');
      if (item.dataset.section === currentSection) {
        item.classList.add('nav__item--active');
      }
    });
  });
}

/**
 * Sets up pill navigation
 */
function setupPillNav() {
  const pills = document.querySelectorAll('.pill');

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const sectionId = pill.dataset.section;
      navigateToSection(sectionId);

      pills.forEach(p => p.classList.remove('pill--active'));
      pill.classList.add('pill--active');
    });
  });

  // Update active pill on scroll
  window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    let currentSection = '';

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 200) {
        currentSection = section.id;
      }
    });

    pills.forEach(pill => {
      pill.classList.remove('pill--active');
      if (pill.dataset.section === currentSection) {
        pill.classList.add('pill--active');
      }
    });
  });
}

/**
 * Sets up bento card navigation
 */
function setupBentoNav() {
  const bentoCards = document.querySelectorAll('.bento__item--card');

  bentoCards.forEach(card => {
    card.addEventListener('click', () => {
      const sectionId = card.dataset.section;
      navigateToSection(sectionId);
    });
  });
}

// ========================================
// Initialization
// ========================================

/**
 * Main initialization function
 */
function init() {
  // Load saved state
  AppState.load();

  // Initialize theme
  ThemeManager.init();

  // Setup theme toggle
  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => ThemeManager.toggle());
  }

  // Initialize all sections
  initializeSection('section-viewing', 'viewing');
  initializeSection('section-buying', 'buying');
  initializeSection('section-handover', 'handover');
  initializeSection('section-loan', 'loan');

  // Setup navigation
  setupNavigation();
  setupPillNav();
  setupBentoNav();

  // Update total progress
  updateTotalProgress();

  console.log('House Buying Records initialized successfully!');
}

// Run initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

