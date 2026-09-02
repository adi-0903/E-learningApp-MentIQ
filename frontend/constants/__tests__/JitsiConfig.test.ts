import {
  JITSI_DOMAIN,
  JITSI_INTERFACE_CONFIG,
  JITSI_CONFIG,
  getJitsiMeetUrl,
  getRoomName,
  validateJitsiConfig,
} from '../JitsiConfig';

describe('JitsiConfig', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe('Constants', () => {
    it('should have correct default JITSI_DOMAIN', () => {
      expect(JITSI_DOMAIN).toBe('meet.jit.si');
    });

    it('should have expected JITSI_INTERFACE_CONFIG', () => {
      expect(JITSI_INTERFACE_CONFIG).toEqual({
        DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        MOBILE_APP_PROMO: false,
        SHOW_CHROME_EXTENSION_BANNER: false,
      });
    });

    it('should have expected JITSI_CONFIG', () => {
      expect(JITSI_CONFIG).toEqual({
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
      });
    });
  });

  describe('getJitsiMeetUrl', () => {
    it('should generate URL using default JITSI_DOMAIN when domain is not supplied', () => {
      const url = getJitsiMeetUrl('room-123');
      expect(url).toBe('https://meet.jit.si/room-123');
    });

    it('should generate URL using custom domain when domain is provided', () => {
      const url = getJitsiMeetUrl('room-123', 'custom.jitsi.net');
      expect(url).toBe('https://custom.jitsi.net/room-123');
    });
  });

  describe('getRoomName', () => {
    it('should format room name correctly with numeric classId', () => {
      expect(getRoomName(42)).toBe('mentiq_live_class_42');
    });

    it('should format room name correctly with string classId', () => {
      expect(getRoomName('class-abc-789')).toBe('mentiq_live_class_class-abc-789');
    });
  });

  describe('validateJitsiConfig', () => {
    it('should return true and not log a warning when JITSI_DOMAIN is configured', () => {
      const isValid = validateJitsiConfig();

      expect(isValid).toBe(true);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('should return false and log a warning when domain is empty', () => {
      const isValid = validateJitsiConfig('');

      expect(isValid).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Jitsi domain not configured.');
    });
  });
});
