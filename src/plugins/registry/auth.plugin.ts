import { PluginFactory } from '../base/plugin';
import { AuthModule } from '../../modules/auth/auth.module';

export const authPluginFactory: PluginFactory = (config, context) => {
  return new AuthModule(config, context);
}; 