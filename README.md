# AI Gateway Service

## Overview
This project implements a secure AI Gateway that mediates access between client applications and AI providers.

## Architecture
Flutter Web / Mobile → Next.js API → AI Provider

## Key Design Decisions
- AI logic centralized in backend
- Provider abstraction via AIClient interface
- Secure environment-based API keys
- Stateless API for horizontal scaling

## Future Improvements
- Multiple AI providers
- Rate limiting & quotas
- Streaming responses
- Usage analytics
