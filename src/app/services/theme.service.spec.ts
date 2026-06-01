import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('defaults to light mode when localStorage is empty', () => {
    expect(service.dark()).toBeFalse();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
  });

  it('toggle() switches to dark mode', () => {
    service.toggle();
    expect(service.dark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('toggle() twice returns to light mode', () => {
    service.toggle();
    service.toggle();
    expect(service.dark()).toBeFalse();
    expect(document.documentElement.classList.contains('dark')).toBeFalse();
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('reads dark state from localStorage on init', () => {
    localStorage.setItem('theme', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const freshService: ThemeService = TestBed.inject(ThemeService);
    expect(freshService.dark()).toBeTrue();
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
  });
});
