<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Contact</h1>
      <p class="page-desc">Get in touch with the NeuroLS team</p>
    </div>

    <div class="contacts-grid">
      <a v-for="c in contacts" :key="c.email" :href="`mailto:${c.email}`" class="contact-card">
        <div class="contact-avatar">{{ initials(c.name) }}</div>
        <div class="contact-info">
          <div class="contact-name">{{ c.name }}</div>
          <div class="contact-role">{{ c.role }}</div>
          <div class="contact-email">{{ c.email }}</div>
        </div>
        <svg class="contact-arrow" viewBox="0 0 16 16" fill="none" width="14" height="14">
          <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const contacts = [
  { name: 'Author 1', role: 'First Author', email: 'author1@example.edu' },
  { name: 'Author 2', role: 'Second Author', email: 'author2@example.edu' },
  { name: 'Dingyi Zhang', role: 'Third Author', email: 'zhangdy1013@gmail.com' },
  { name: 'Yun Wang', role: 'Principal Investigator', email: 'yun.wang2@emory.edu' },
]

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
</script>

<style scoped>
.page-header { margin-bottom: 28px; }
.page-title { font-size: 1.75rem; font-weight: 700; letter-spacing: -0.03em; color: #1c1917; }
.page-desc { font-size: 1rem; color: #a8a29e; margin-top: 5px; }

.contacts-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 560px;
}

.contact-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #ffffff;
  border: 1px solid #e8e4dc;
  border-radius: 14px;
  padding: 18px 20px;
  box-shadow: 0 1px 4px rgba(28,25,23,0.05);
  text-decoration: none;
  color: inherit;
  transition: all 0.15s ease;
}
.contact-card:hover {
  border-color: #c4b5fd;
  box-shadow: 0 4px 14px rgba(124,58,237,0.1);
  transform: translateY(-1px);
}

.contact-avatar {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #9333ea);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.04em;
}

.contact-info { flex: 1; min-width: 0; }
.contact-name { font-size: 0.95rem; font-weight: 600; color: #1c1917; }
.contact-role { font-size: 0.8rem; color: #a8a29e; margin-top: 2px; }
.contact-email { font-size: 0.82rem; color: #7c3aed; margin-top: 5px; font-weight: 500; }

.contact-arrow { color: #d6d3cd; flex-shrink: 0; transition: color 0.15s, transform 0.15s; }
.contact-card:hover .contact-arrow { color: #7c3aed; transform: translateX(3px); }
</style>
