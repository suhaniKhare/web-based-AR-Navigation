/**
 * labMenu.js
 * Renders the secondary selection menu dedicated to lab selection items.
 */

class LabMenuManager {
    /**
     * Builds the inner HTML nodes representing lists of labs.
     * @param {HTMLElement} container The button wrapper element inside the modal.
     * @param {Array} labs Array of lab details [{id, label}]
     * @param {function} onSelect Selection callback.
     */
    populate(container, labs, onSelect) {
        container.innerHTML = '';
        
        if (!labs || labs.length === 0) {
            container.innerHTML = `<p style="font-size:13px; color:#ef4444;">No classrooms registered for this building.</p>`;
            return;
        }

        labs.forEach(lab => {
            const button = document.createElement('button');
            button.className = 'indoor-btn indoor-btn-secondary';
            button.style.display = 'flex';
            button.style.justifyContent = 'space-between';
            button.style.alignItems = 'center';
            button.style.padding = '12px 16px';
            
            button.innerHTML = `
                <span style="font-weight: 600;">${lab.label}</span>
                <span style="font-size: 11px; opacity: 0.6; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px;">Room</span>
            `;

            button.addEventListener('click', () => {
                onSelect(lab.id);
            });

            container.appendChild(button);
        });
    }
}

window.labMenu = new LabMenuManager();
