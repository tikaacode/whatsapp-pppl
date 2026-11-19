/**
 * API client wrapper for PHP backend endpoints under `api/`.
 */
export async function apiRequest(url, options = {}) {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = Object.assign(
    { Accept: 'application/json' },
    isFormData ? {} : options.headers || {}
  );

  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && payload.message
        ? payload.message
        : `HTTP error! status: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function checkSession() {
  return apiRequest('api/auth.php?action=me');
}

export function sendOtp(phone) {
  return apiRequest('api/auth.php?action=send_otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone, otp, namaProfil) {
  const body = { phone, otp };
  if (namaProfil) {
    body.nama_profil = namaProfil;
  }
  return apiRequest('api/auth.php?action=verify_otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function updateProfile(namaProfil) {
  return apiRequest('api/auth.php?action=update_profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama_profil: namaProfil }),
  });
}

export function logoutUser() {
  return apiRequest('api/auth.php?action=logout', {
    method: 'POST',
  });
}

export function switchDemoUser(userId) {
  return apiRequest('api/auth.php?action=switch_user', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
}

export function fetchDemoUsers() {
  return apiRequest('api/auth.php?action=demo_users');
}

export function fetchContacts() {
  return apiRequest('api/contacts.php?action=list');
}

export function startConversation(contactId) {
  return apiRequest('api/contacts.php?action=start_conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contact_id: contactId }),
  });
}

export function fetchMessages(conversationId, sinceId = 0) {
  let url = `api/messages.php?conversation_id=${encodeURIComponent(conversationId)}`;
  if (sinceId > 0) {
    url += `&since_id=${encodeURIComponent(sinceId)}`;
  }
  return apiRequest(url);
}

export function sendMessageApi(conversationId, messageText) {
  return apiRequest('api/messages.php?action=send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_id: conversationId,
      message_text: messageText,
    }),
  });
}

export function fetchStatusFeed() {
  return apiRequest('api/status.php?action=feed');
}

export function createStatusApi({
  jenis_status,
  isi_status,
  warna_latar,
  privasi,
  audiens_ids = [],
  mediaFile = null,
}) {
  if (jenis_status === 'media' && mediaFile) {
    const formData = new FormData();
    formData.append('jenis_status', 'media');
    formData.append('isi_status', isi_status || '');
    formData.append('privasi', privasi || 'semua_kontak');
    formData.append('audiens_ids', audiens_ids.join(','));
    formData.append('media_file', mediaFile);

    return apiRequest('api/status.php?action=create', {
      method: 'POST',
      body: formData,
    });
  }

  return apiRequest('api/status.php?action=create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jenis_status: jenis_status || 'teks',
      isi_status: isi_status || '',
      warna_latar: warna_latar || '#075e54',
      privasi: privasi || 'semua_kontak',
      audiens_ids,
    }),
  });
}

export function markStatusViewed(statusId) {
  return apiRequest('api/status.php?action=view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status_id: statusId }),
  });
}

export function deleteStatusApi(statusId) {
  return apiRequest('api/status.php?action=delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status_id: statusId }),
  });
}

export function fetchStatusContacts() {
  return apiRequest('api/status.php?action=contacts');
}
