'use strict';
const header=document.querySelector('.site-header');
const toggle=document.getElementById('menu-toggle');
const nav=document.getElementById('primary-nav');
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function closeNav(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');nav.classList.remove('is-open')}
toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.classList.toggle('is-open',open)});
nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeNav));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeNav()});
function onScroll(){header.classList.toggle('is-scrolled',window.scrollY>24)}
window.addEventListener('scroll',onScroll,{passive:true});onScroll();
const reveals=[...document.querySelectorAll('.reveal')];
if('IntersectionObserver'in window&&!reduce){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{threshold:.12,rootMargin:'0px 0px -30px 0px'});reveals.forEach((item,i)=>{item.style.transitionDelay=(i%4)*65+'ms';observer.observe(item)})}else reveals.forEach(x=>x.classList.add('is-visible'));
const tabs=[...document.querySelectorAll('.menu-tab')],cards=[...document.querySelectorAll('.menu-card')];
tabs.forEach(tab=>tab.addEventListener('click',()=>{tabs.forEach(t=>{const active=t===tab;t.classList.toggle('is-active',active);t.setAttribute('aria-pressed',String(active))});cards.forEach(card=>card.classList.toggle('is-hidden',tab.dataset.filter!=='all'&&card.dataset.category!==tab.dataset.filter))}));
const box=document.getElementById('lightbox'),boxImg=document.getElementById('lightbox-image'),boxClose=document.getElementById('lightbox-close');let focusBefore=null;
function closeBox(){box.classList.remove('is-open');box.setAttribute('aria-hidden','true');document.body.classList.remove('no-scroll');boxImg.removeAttribute('src');if(focusBefore)focusBefore.focus()}
document.querySelectorAll('.gallery-item').forEach(item=>item.addEventListener('click',()=>{focusBefore=item;boxImg.src=item.dataset.full;boxImg.alt=item.querySelector('img').alt;box.classList.add('is-open');box.setAttribute('aria-hidden','false');document.body.classList.add('no-scroll');boxClose.focus()}));
boxClose.addEventListener('click',closeBox);box.addEventListener('click',e=>{if(e.target===box)closeBox()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('is-open'))closeBox()});
const form=document.getElementById('booking-form'),status=document.getElementById('form-status'),date=form.elements.date;
const now=new Date(),local=new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10);date.min=local;const latest=new Date(now);latest.setDate(latest.getDate()+180);date.max=new Date(latest.getTime()-latest.getTimezoneOffset()*60000).toISOString().slice(0,10);
const fields=['name','email','date','time'];
form.addEventListener('submit',async e=>{e.preventDefault();status.textContent='';if(!form.reportValidity())return;const button=form.querySelector('button[type=submit]');button.disabled=true;button.textContent='Checking request…';const payload=Object.fromEntries(new FormData(form));payload.guests=Number(payload.guests);
try{const response=await fetch('/api/reservations',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},credentials:'same-origin',body:JSON.stringify(payload)});const result=await response.json();fields.forEach(field=>{const input=form.elements[field],msg=document.getElementById(field+'-error');if(msg)msg.textContent=(result.errors||{})[field]||'';if(input)input.setAttribute('aria-invalid',String(Boolean((result.errors||{})[field])))});if(!response.ok)throw new Error(result.message||'Request could not be checked.');status.textContent=result.message;form.reset();date.min=local;status.classList.remove('error')}catch(err){status.textContent=err.message||'Something went wrong.';status.classList.add('error')}finally{button.disabled=false;button.textContent='Send a table request ↗'}});
document.getElementById('year').textContent=new Date().getFullYear();
