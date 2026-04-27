# 🔒 Security Guidelines for ClosetAI

This document outlines security best practices and guidelines for the ClosetAI application.

## ✅ Security Checklist

### **Environment Variables & API Keys**
- [x] All API keys use environment variables (`process.env.*`)
- [x] No hardcoded API keys in source code
- [x] `.env*` files excluded in `.gitignore`
- [x] API responses strip sensitive data (api_key, api_secret)
- [x] Public environment variables use `NEXT_PUBLIC_` prefix correctly

### **Authentication & Authorization**
- [x] Firebase Authentication properly configured
- [x] Firestore security rules implemented
- [x] User authentication checks in place
- [x] Admin-only functions protected

### **Data Protection**
- [x] Sensitive data not logged in production
- [x] API keys redacted in logs (`url.replace(apiKey, "[REDACTED]")`)
- [x] User data protected with proper access controls

### **Infrastructure Security**
- [x] Processing service health checks
- [x] Input validation on all API endpoints
- [x] Request rate limiting implemented
- [x] Proper error handling without exposing internals

## 🔧 Required Environment Variables

### **Production Environment Setup**
Create a `.env.local` file with these variables:

```env
# Firebase Configuration (Public - safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Cloudinary Configuration (Private - keep secret)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional Services
WEATHER_API_KEY=your_weather_api_key
MESHY_API_KEY=your_meshy_api_key
PROCESSING_SERVICE_URL=http://localhost:8000
```

### **Environment Variable Security**
- ✅ **Public Variables**: Use `NEXT_PUBLIC_` prefix for client-side access
- ✅ **Private Variables**: No prefix, server-side only
- ✅ **API Secrets**: Never use `NEXT_PUBLIC_` prefix
- ✅ **Cloud Names**: Safe to expose (required for client uploads)

## 🛡️ Security Best Practices

### **1. API Key Management**
```typescript
// ✅ GOOD: Use environment variables
const apiKey = process.env.CLOUDINARY_API_KEY;

// ❌ BAD: Hardcoded keys
const apiKey = "abc123xyz789";

// ✅ GOOD: Strip from responses
if (result.api_key) delete result.api_key;
if (result.api_secret) delete result.api_secret;
```

### **2. Logging Security**
```typescript
// ✅ GOOD: Redact sensitive data
logger.info("API call", { 
  url: url.replace(apiKey, "[REDACTED]"),
  status: 200 
});

// ❌ BAD: Log sensitive data
logger.info("API call", { url, apiKey, status: 200 });
```

### **3. Authentication Checks**
```typescript
// ✅ GOOD: Verify authentication
if (!user) {
  return res.status(401).json({ error: "Unauthorized" });
}

// ✅ GOOD: Check ownership
const itemRef = doc(db, "users", user.uid, "closetItems", itemId);
```

### **4. Input Validation**
```typescript
// ✅ GOOD: Validate inputs
if (!publicId || typeof publicId !== 'string') {
  return res.status(400).json({ error: "Invalid publicId" });
}

// ✅ GOOD: Sanitize data
const sanitizedInput = input.trim().toLowerCase();
```

## 🚨 Common Security Pitfalls

### **❌ What NOT to Do:**

1. **Never commit `.env` files**
   ```bash
   # Add to .gitignore
   .env*
   ```

2. **Never hardcode API keys**
   ```javascript
   // ❌ NEVER DO THIS
   const API_KEY = "sk-1234567890abcdef";
   ```

3. **Never expose private keys to client**
   ```javascript
   // ❌ NEVER DO THIS
   const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
   ```

4. **Never log sensitive data**
   ```javascript
   // ❌ NEVER DO THIS
   console.log("User password:", password);
   ```

## 🔍 Security Testing

### **Regular Security Checks**
```bash
# Check for exposed secrets
npm install -g truffleHog
trufflehog --regex --entropy=False .

# Check dependencies for vulnerabilities
npm audit
npm audit fix

# Check for hardcoded secrets
grep -r "api_key\|secret\|password" --exclude-dir=node_modules .
```

### **Manual Security Review**
- [ ] Review all environment variable usage
- [ ] Verify API response sanitization
- [ ] Check Firestore security rules
- [ ] Validate authentication flows
- [ ] Test unauthorized access scenarios

## 🚀 Deployment Security

### **Production Deployment Checklist**
- [ ] All environment variables configured
- [ ] Firestore security rules deployed
- [ ] API endpoints require authentication
- [ ] Error messages don't expose internals
- [ ] Logs don't contain sensitive data
- [ ] HTTPS enabled for all connections
- [ ] CORS properly configured

### **Infrastructure Security**
- [ ] Processing service secured (Docker container)
- [ ] Network access restricted
- [ ] Health checks don't expose sensitive info
- [ ] Request rate limiting enabled
- [ ] Monitoring and alerting configured

## 🆘 Incident Response

### **If API Keys Are Exposed:**
1. **Immediately rotate all exposed keys**
2. **Update environment variables**
3. **Review git history for exposure**
4. **Monitor for unauthorized usage**
5. **Update any affected services**

### **Security Contact**
For security issues, follow responsible disclosure:
1. Do not create public issues for security vulnerabilities
2. Contact maintainers privately
3. Allow time for fixes before public disclosure

## 📚 Additional Resources

- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/security-best-practices)
- [Cloudinary Security Guidelines](https://cloudinary.com/documentation/security)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update security practices as the application evolves. 