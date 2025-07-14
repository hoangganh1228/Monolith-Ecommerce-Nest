import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    // used by passport to validate the token
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // get the token from the header
      ignoreExpiration: false, // don't ignore the expiration, we want to check if the token is expired
      secretOrKey: config.get<string>('JWT_SECRET')!, // get the secret key from the config
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
