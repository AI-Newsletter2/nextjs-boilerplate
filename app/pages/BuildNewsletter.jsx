'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  createEmptyDraft,
  readNewsletterDraft,
  writeNewsletterDraft,
} from '../create/draft';
import './create.css';

const stack = [
  { type: 'title', label: 'Title', description: 'A heading for your newsletter' },
  { type: 'text', label: 'Text', description: 'A short text block' },
];

const suggestedTopics = ['Technology', 'Culture', 'Business'];

function createModule(type) {
  const block = {
    id: window.crypto.randomUUID(),
    type,
    title: type === 'topic' ? 'Your topic' : '',
    description: '',
    content: type === 'title' ? 'Section title' : type === 'text' ? 'Write a little something…' : '',
  };
  return block;
}

function NewsletterModuleView({ module, selected, onSelect, onDrop, onDragStart }) {
  return (
    <article
      className={`newsletter_module module_${module.type}${selected ? ' selected' : ''}`}
      draggable
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragOver={(event) => event.preventDefault()}
      onDrop={onDrop}
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect();
        }
      }}
      aria-label={`Select ${module.type} module`}
    >
      {module.type === 'topic' ? (
        <>
          <span className="module_category">{module.title || 'Untitled topic'}</span>
          <p>{module.description || 'Add a short description of this topic.'}</p>
        </>
      ) : module.type === 'title' ? (
        <h2>{module.content || 'Title'}</h2>
      ) : (
        <p>{module.content || 'Text'}</p>
      )}
      <span className="module_drag_hint" aria-hidden="true">⠿</span>
    </article>
  );
}

export default function BuildNewsletter() {
  const router = useRouter();
  const [draft, setDraft] = useState(createEmptyDraft);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    async function initialize() {
      const newsletterId = new URLSearchParams(window.location.search).get('id');
      try {
        if (newsletterId) {
          const response = await fetch(`/api/newsletters/${newsletterId}`);
          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Unable to load newsletter.');
          if (!active) return;
          const savedDraft = {
            ...createEmptyDraft(),
            ...result.newsletter,
            publish_time: result.newsletter.publish_time?.slice(0, 5) || '08:00',
          };
          setDraft(savedDraft);
          writeNewsletterDraft(savedDraft);
        } else {
          const savedDraft = readNewsletterDraft();
          if (savedDraft.id) {
            setDraft(createEmptyDraft());
            writeNewsletterDraft(createEmptyDraft());
          } else {
            setDraft(savedDraft);
          }
        }
      } catch (loadError) {
        if (active) setError(loadError.message);
      } finally {
        if (active) {
          setIsLoading(false);
          setIsReady(true);
        }
      }
    }
    initialize();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isReady) writeNewsletterDraft(draft);
  }, [draft, isReady]);

  const selectedModule = draft.layout.find((module) => module.id === selectedId);

  function addModule(type, beforeId = null) {
    const newBlock = createModule(type);
    setDraft((current) => {
      const index = beforeId
        ? current.layout.findIndex((item) => item.id === beforeId)
        : -1;
      const layout = [...current.layout];
      layout.splice(index < 0 ? layout.length : index, 0, newBlock);
      return { ...current, layout };
    });
    setSelectedId(newBlock.id);
  }

  function handleDrop(event, beforeId = null) {
    event.preventDefault();
    event.stopPropagation();
    const data = event.dataTransfer.getData('application/briefly-module');
    if (!data) return;
    try {
      const payload = JSON.parse(data);
      if (payload.kind === 'stack' && stack.some((item) => item.type === payload.type)) {
        addModule(payload.type, beforeId);
      } else if (payload.kind === 'existing' && payload.id !== beforeId) {
        setDraft((current) => {
          const from = current.layout.findIndex((item) => item.id === payload.id);
          if (from < 0) return current;
          const layout = [...current.layout];
          const [movedBlock] = layout.splice(from, 1);
          const to = beforeId ? layout.findIndex((item) => item.id === beforeId) : -1;
          layout.splice(to < 0 ? layout.length : to, 0, movedBlock);
          return { ...current, layout };
        });
      }
    } catch {
      setError('That module could not be moved. Try again.');
    }
  }

  function updateSelected(field, value) {
    setDraft((current) => ({
      ...current,
      layout: current.layout.map((module) =>
        module.id === selectedId ? { ...module, [field]: value } : module,
      ),
    }));
  }

  function deleteSelected() {
    setDraft((current) => ({
      ...current,
      layout: current.layout.filter((module) => module.id !== selectedId),
    }));
    setSelectedId(null);
  }

  function addSuggestedTopic(topic) {
    const newBlock = createModule('topic');
    newBlock.title = topic;
    newBlock.description = `A thoughtful look at ${topic.toLowerCase()} and the ideas shaping it.`;
    setDraft((current) => ({ ...current, layout: [...current.layout, newBlock] }));
    setSelectedId(newBlock.id);
  }

  function continueToDeploy() {
    writeNewsletterDraft(draft);
    router.push('/create/deploy');
  }

  return (
    <div className="create_page">
      <header className="create_header">
        <Link className="create_brand" href="/">
          <span aria-hidden="true">b</span> briefly
        </Link>
        <div className="create_steps" aria-label="Newsletter creation steps">
          <span className="create_step active"><b>1</b> Build</span>
          <span className="step_line" />
          <span className="create_step"><b>2</b> Deploy</span>
        </div>
        <Link className="create_exit" href="/newsletters">Save &amp; exit</Link>
      </header>

      <main className="build_workspace">
        <aside className="build_sidebar">
          <div className="builder_panel_heading">
            <p className="create_eyebrow">YOUR WORKSPACE</p>
            <h1>Build your layout</h1>
            <p>Drag a block onto your newsletter. Select a block to edit it.</p>
          </div>

          {selectedModule && (
            <section className="module_editor" aria-label="Edit selected module">
              <div className="module_editor_heading">
                <h2>Edit {selectedModule.type === 'topic' ? 'topic' : selectedModule.type}</h2>
                <button type="button" onClick={() => setSelectedId(null)} aria-label="Close editor">×</button>
              </div>
              {selectedModule.type === 'topic' ? (
                <>
                  <label>
                    Topic
                    <input
                      value={selectedModule.title}
                      maxLength={100}
                      onChange={(event) => updateSelected('title', event.target.value)}
                    />
                  </label>
                  <label>
                    Short description
                    <textarea
                      value={selectedModule.description}
                      maxLength={280}
                      rows={3}
                      onChange={(event) => updateSelected('description', event.target.value)}
                    />
                  </label>
                </>
              ) : (
                <label>
                  {selectedModule.type === 'title' ? 'Title text' : 'Text'}
                  <textarea
                    value={selectedModule.content}
                    maxLength={600}
                    rows={selectedModule.type === 'title' ? 2 : 5}
                    onChange={(event) => updateSelected('content', event.target.value)}
                  />
                </label>
              )}
              <button className="remove_module_button" type="button" onClick={deleteSelected}>
                Remove block
              </button>
            </section>
          )}

          <section className="stack_section" aria-labelledby="stack-title">
            <div className="stack_heading">
              <h2 id="stack-title">Stack</h2>
              <span>{stack.length} blocks</span>
            </div>
            <div className="stack_items">
              {stack.map((item) => (
                <button
                  className="stack_item"
                  draggable
                  key={item.type}
                  type="button"
                  onClick={() => addModule(item.type)}
                  onDragStart={(event) =>
                    event.dataTransfer.setData(
                      'application/briefly-module',
                      JSON.stringify({ kind: 'stack', type: item.type }),
                    )
                  }
                >
                  <span className={`stack_icon stack_${item.type}`} aria-hidden="true">
                    {item.type === 'title' ? 'T' : '¶'}
                  </span>
                  <span className="stack_item_copy">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                  <span className="stack_add" aria-hidden="true">+</span>
                </button>
              ))}
            </div>
          </section>

          <section className="suggested_topics">
            <h2>Topic ideas</h2>
            <div>
              <button type="button" onClick={() => addSuggestedTopic('Your topic')}>
                + Add a topic
              </button>
              {suggestedTopics.map((topic) => (
                <button type="button" key={topic} onClick={() => addSuggestedTopic(topic)}>
                  + {topic}
                </button>
              ))}
            </div>
          </section>

          <label className="template_picker">
            Template
            <select
              value={draft.template || 'editorial'}
              onChange={(event) =>
                setDraft((current) => ({ ...current, template: event.target.value }))
              }
            >
              <option value="editorial">Editorial</option>
              <option value="minimal">Minimal</option>
              <option value="classic">Classic</option>
            </select>
          </label>
        </aside>

        <section
          className="newsletter_canvas_area"
          aria-label="Newsletter layout preview"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => handleDrop(event)}
        >
          <div className="canvas_toolbar">
            <div>
              <span className="canvas_status_dot" />
              <span>Live preview</span>
            </div>
            <span>{draft.layout.length} {draft.layout.length === 1 ? 'block' : 'blocks'}</span>
          </div>

          {isLoading ? (
            <div className="canvas_loading">Loading your layout…</div>
          ) : error ? (
            <div className="canvas_error" role="alert">{error}</div>
          ) : (
            <div className={`newsletter_canvas template_${draft.template || 'editorial'}`}>
              <div className="canvas_newsletter_brand">
                <span className="dashboard_mark" aria-hidden="true">b</span>
                <span>briefly</span>
                <span className="canvas_date">YOUR PERSONAL BRIEF</span>
              </div>
              <div className="canvas_modules">
                {draft.layout.map((module) => (
                  <NewsletterModuleView
                    key={module.id}
                    module={module}
                    selected={selectedId === module.id}
                    onSelect={() => setSelectedId(module.id)}
                    onDragStart={(event) =>
                      event.dataTransfer.setData(
                        'application/briefly-module',
                        JSON.stringify({ kind: 'existing', id: module.id }),
                      )
                    }
                    onDrop={(event) => handleDrop(event, module.id)}
                  />
                ))}
                <button
                  className="canvas_dropzone"
                  type="button"
                  onClick={() => addModule('topic')}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => handleDrop(event)}
                >
                  <span aria-hidden="true">+</span>
                  Drop a block here or click to add a topic
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="create_bottom_bar">
        <Link href="/newsletters">Cancel</Link>
        <button className="primary_create_button" type="button" onClick={continueToDeploy}>
          Next: Deploy <span aria-hidden="true">→</span>
        </button>
      </footer>
    </div>
  );
}
