// frontend/src/components/CustomerForm.jsx
import React from 'react';

export default function CustomerForm({ 
    editingId, 
    form, 
    editForm, 
    onFormChange, 
    onEditFormChange, 
    onSubmit, 
    onCancelEdit 
}) {
    return (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
            <form 
                onSubmit={onSubmit} 
                style={{ background: '#f4f4f4', padding: '15px', borderRadius: '6px', flex: 1, minWidth: '280px', boxSizing: 'border-box' }}
            >
                <h4 style={{ marginTop: 0 }}>{editingId ? 'Edit Customer Profile' : 'Register New Customer'}</h4>
                
                <input 
                    type="text" 
                    placeholder="Full Name" 
                    value={editingId ? editForm.name : form.name} 
                    onChange={e => {
                        const val = e.target.value;
                        if (editingId) {
                            onEditFormChange({ ...editForm, name: val });
                        } else {
                            onFormChange({ ...form, name: val });
                        }
                    }} 
                    required 
                    style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px', boxSizing: 'border-box' }} 
                />
                
                <input 
                    type="text" 
                    placeholder="Phone Number" 
                    value={editingId ? editForm.phone : form.phone} 
                    onChange={e => {
                        const val = e.target.value;
                        if (editingId) {
                            onEditFormChange({ ...editForm, phone: val });
                        } else {
                            onFormChange({ ...form, phone: val });
                        }
                    }} 
                    style={{ display: 'block', width: '100%', marginBottom: '8px', padding: '6px', boxSizing: 'border-box' }} 
                />
                
                <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={editingId ? editForm.email : form.email} 
                    onChange={e => {
                        const val = e.target.value;
                        if (editingId) {
                            onEditFormChange({ ...editForm, email: val });
                        } else {
                            onFormChange({ ...form, email: val });
                        }
                    }} 
                    style={{ display: 'block', width: '100%', marginBottom: '12px', padding: '6px', boxSizing: 'border-box' }} 
                />
                
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                        type="submit" 
                        style={{ 
                            background: editingId ? '#ffc107' : 'green', 
                            color: editingId ? 'black' : 'white', 
                            padding: '8px 12px', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer', 
                            fontWeight: 'bold' 
                        }}
                    >
                        {editingId ? 'Update Profile' : 'Save Customer Profile'}
                    </button>
                    
                    {editingId && (
                        <button 
                            type="button" 
                            onClick={onCancelEdit} 
                            style={{ background: '#6c757d', color: 'white', padding: '8px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}