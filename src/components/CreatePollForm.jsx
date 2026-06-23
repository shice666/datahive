import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['🎬 娱乐', '🤖 科技', '📱 软件', '🍔 生活'];

export default function CreatePollForm({ onClose, onSubmit }) {
  const [question, setQuestion] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('🍔 生活');
  const [tags, setTags] = useState('');
  const [options, setOptions] = useState(['', '']); // Initial 2 empty options
  const [error, setError] = useState('');

  const handleAddOption = () => {
    if (options.length >= 6) return; // Maximum 6 options
    setOptions([...options, '']);
  };

  const handleRemoveOption = (index) => {
    if (options.length <= 2) return; // Minimum 2 options
    const newOptions = [...options];
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    // Filter empty options
    const filteredOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    
    if (filteredOptions.length < 2) {
      setError('请至少填写 2 个有效选项！');
      return;
    }

    if (!question.trim()) {
      setError('请输入你发起的话题！');
      return;
    }

    onSubmit({
      question: question.trim(),
      desc: desc.trim(),
      category,
      tags: tags.trim(),
      options: filteredOptions
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">发起新话题</h2>
          <button className="btn-icon" onClick={onClose} style={{ border: 'none', background: 'transparent' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '10px 14px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-error)', borderRadius: 'var(--radius-sm)', color: 'var(--color-error)', fontSize: '13px', marginBottom: '16px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {/* Question title */}
            <div className="form-group">
              <label className="form-label">话题标题 *</label>
              <input
                type="text"
                placeholder="例如：大家常用的输入法是什么？"
                className="form-input"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                maxLength={80}
              />
            </div>

            {/* Background Desc */}
            <div className="form-group">
              <label className="form-label">背景补充 (选填)</label>
              <textarea
                placeholder="补充一下你发起这个统计的背景，或者你对这个问题的看法..."
                className="form-input form-textarea"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                maxLength={300}
              />
            </div>

            {/* Category and Tags */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">所属分类</label>
                <select
                  className="form-input"
                  style={{ appearance: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat} style={{ backgroundColor: 'var(--bg-input)' }}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">标签 (用逗号分隔)</label>
                <input
                  type="text"
                  placeholder="例如：软件, 工具, 习惯"
                  className="form-input"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            {/* Options list */}
            <div className="form-group">
              <div className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>投票选项 * (至少2个，最多6个)</span>
                {options.length < 6 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                  >
                    <Plus size={14} />
                    <span>添加选项</span>
                  </button>
                )}
              </div>

              <div className="options-builder">
                {options.map((option, index) => (
                  <div key={index} className="option-input-row">
                    <span style={{ color: 'var(--text-muted)', fontSize: '14px', width: '20px' }}>{index + 1}.</span>
                    <input
                      type="text"
                      placeholder={`输入第 ${index + 1} 个选项`}
                      className="form-input"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      required
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        className="btn-icon"
                        style={{ border: 'none', color: 'var(--color-error)' }}
                        onClick={() => handleRemoveOption(index)}
                        title="删除此选项"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              发布话题
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
