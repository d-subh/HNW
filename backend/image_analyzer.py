import cv2
import numpy as np
from PIL import Image
import io
from typing import Dict, List, Tuple
import base64

class ImagePatternDetector:
    """
    Detects manipulated images, fake trade screens, and doctored profit screenshots
    using computer vision techniques.
    """
    
    def __init__(self):
        self.manipulation_threshold = 0.6
        self.fake_interface_confidence = 0.5
        
    def analyze_image(self, image_data: bytes) -> Dict:
        """
        Analyze image for signs of manipulation and fake interfaces.
        
        Args:
            image_data: Binary image data
            
        Returns:
            Dictionary with analysis results and risk scores
        """
        try:
            # Convert bytes to image
            image = Image.open(io.BytesIO(image_data))
            image_np = np.array(image)
            
            # Convert RGB to BGR for OpenCV
            if len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_cv = cv2.cvtColor(image_np, cv2.COLOR_RGB2BGR)
            else:
                image_cv = image_np
                
            # Run all detection methods
            results = {
                'overall_risk_score': 0,
                'is_suspicious': False,
                'detected_issues': [],
                'manipulation_indicators': self._detect_image_manipulation(image_cv),
                'fake_interface_indicators': self._detect_fake_interface(image_cv),
                'chart_tampering_indicators': self._detect_chart_manipulation(image_cv),
                'inconsistency_indicators': self._detect_inconsistencies(image_cv),
            }
            
            # Calculate overall risk score
            results['overall_risk_score'] = self._calculate_risk_score(results)
            results['is_suspicious'] = results['overall_risk_score'] > self.manipulation_threshold
            
            return results
            
        except Exception as e:
            return {
                'error': str(e),
                'overall_risk_score': 0,
                'is_suspicious': False,
                'detected_issues': [f'Error analyzing image: {str(e)}']
            }
    
    def _detect_image_manipulation(self, image: np.ndarray) -> Dict:
        """Detect signs of image editing and compression artifacts."""
        indicators = {
            'compression_artifacts': 0,
            'color_inconsistencies': 0,
            'edge_tampering': 0,
            'metadata_anomalies': 0,
            'issues': []
        }
        
        try:
            # Check for compression artifacts using Laplacian variance
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            
            # Low Laplacian variance suggests heavy compression (common in edited images)
            if laplacian_var < 100:
                indicators['compression_artifacts'] = 0.7
                indicators['issues'].append('Heavy compression detected - possible editing')
            
            # Detect color channel inconsistencies
            b_hist = cv2.calcHist([image], [0], None, [256], [0, 256])
            g_hist = cv2.calcHist([image], [1], None, [256], [0, 256])
            r_hist = cv2.calcHist([image], [2], None, [256], [0, 256])
            
            # Calculate chi-square distances between channels
            bg_diff = cv2.compareHist(b_hist, g_hist, cv2.HISTCMP_CHISQR)
            gr_diff = cv2.compareHist(g_hist, r_hist, cv2.HISTCMP_CHISQR)
            
            if bg_diff > 1000 or gr_diff > 1000:
                indicators['color_inconsistencies'] = 0.6
                indicators['issues'].append('Unusual color channel distribution - possible manipulation')
            
            # Detect edge tampering using Canny edge detection
            edges = cv2.Canny(gray, 100, 200)
            edge_ratio = np.sum(edges > 0) / edges.size
            
            # Unusually high or low edge density suggests tampering
            if edge_ratio < 0.01 or edge_ratio > 0.3:
                indicators['edge_tampering'] = 0.5
                indicators['issues'].append('Unusual edge distribution - possible content removal or addition')
            
        except Exception as e:
            indicators['issues'].append(f'Manipulation detection error: {str(e)}')
        
        return indicators
    
    def _detect_fake_interface(self, image: np.ndarray) -> Dict:
        """Detect fake trading app interfaces."""
        indicators = {
            'inconsistent_ui_elements': 0,
            'fake_buttons_detected': 0,
            'suspicious_text_rendering': 0,
            'fake_notifications': 0,
            'issues': []
        }
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect circles (common in fake app buttons/icons)
            circles = cv2.HoughCircles(gray, cv2.HOUGH_GRADIENT, 1, 20,
                                     param1=50, param2=30, minRadius=5, maxRadius=50)
            
            if circles is not None:
                # Check if circles are randomly distributed (suspicious)
                circles = np.uint16(np.around(circles))
                if len(circles[0]) > 10:
                    indicators['fake_buttons_detected'] = 0.5
                    indicators['issues'].append(f'Detected {len(circles[0])} suspicious button-like elements')
            
            # Detect rectangles (UI elements)
            edges = cv2.Canny(gray, 100, 200)
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            # Count rectangular shapes
            rectangles = 0
            for contour in contours:
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / float(h) if h > 0 else 0
                
                # Check if it's a rectangle
                if 0.5 < aspect_ratio < 2.0 and w > 30 and h > 20:
                    rectangles += 1
            
            if rectangles > 15:
                indicators['inconsistent_ui_elements'] = 0.4
                indicators['issues'].append('Excessive rectangular UI elements detected')
            
            # Check for suspicious text regions
            _, binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
            text_ratio = np.sum(binary == 0) / binary.size
            
            if text_ratio > 0.4:
                indicators['suspicious_text_rendering'] = 0.3
                indicators['issues'].append('Unusual text density suggesting synthetic interface')
        
        except Exception as e:
            indicators['issues'].append(f'Interface detection error: {str(e)}')
        
        return indicators
    
    def _detect_chart_manipulation(self, image: np.ndarray) -> Dict:
        """Detect manipulated trading charts."""
        indicators = {
            'chart_artifacting': 0,
            'line_anomalies': 0,
            'grid_inconsistencies': 0,
            'scale_tampering': 0,
            'issues': []
        }
        
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Detect straight lines (chart lines, grids)
            edges = cv2.Canny(gray, 50, 150)
            lines = cv2.HoughLinesP(edges, 1, np.pi/180, 50, minLineLength=50, maxLineGap=10)
            
            if lines is not None:
                horizontal_lines = 0
                vertical_lines = 0
                
                for line in lines:
                    x1, y1, x2, y2 = line[0]
                    angle = np.abs(np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi)
                    
                    if angle < 10 or angle > 170:
                        horizontal_lines += 1
                    elif 80 < angle < 100:
                        vertical_lines += 1
                
                # Check for irregular grid patterns
                if horizontal_lines == 0 or vertical_lines == 0:
                    indicators['grid_inconsistencies'] = 0.4
                    indicators['issues'].append('Missing chart grid elements')
                
                # Detect if grid spacing is irregular
                if horizontal_lines > 0:
                    h_spacing = image.shape[0] / max(horizontal_lines, 1)
                    if h_spacing < 20 or h_spacing > 200:
                        indicators['scale_tampering'] = 0.5
                        indicators['issues'].append('Abnormal chart axis scaling detected')
            
            # Detect smooth curves (candlesticks should have sharp edges)
            contours, _ = cv2.findContours(edges, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
            
            for contour in contours:
                epsilon = 0.02 * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                
                # Number of vertices indicates smoothness
                if len(approx) > 50:
                    indicators['line_anomalies'] = 0.4
                    indicators['issues'].append('Overly smooth lines - possible interpolation artifact')
                    break
        
        except Exception as e:
            indicators['issues'].append(f'Chart detection error: {str(e)}')
        
        return indicators
    
    def _detect_inconsistencies(self, image: np.ndarray) -> Dict:
        """Detect general inconsistencies in the image."""
        indicators = {
            'lighting_inconsistencies': 0,
            'shadow_anomalies': 0,
            'blending_artifacts': 0,
            'issues': []
        }
        
        try:
            # Convert to HSV for color analysis
            hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
            
            # Check for inconsistent lighting using brightness distribution
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            brightness = np.mean(gray)
            brightness_std = np.std(gray)
            
            # Check different regions for lighting inconsistency
            h_split = image.shape[0] // 2
            w_split = image.shape[1] // 2
            
            regions = [
                gray[:h_split, :w_split],
                gray[:h_split, w_split:],
                gray[h_split:, :w_split],
                gray[h_split:, w_split:]
            ]
            
            region_brightness = [np.mean(r) for r in regions]
            brightness_variance = np.var(region_brightness)
            
            if brightness_variance > 1000:
                indicators['lighting_inconsistencies'] = 0.5
                indicators['issues'].append('Inconsistent lighting across regions - possible compositing')
            
            # Detect shadow anomalies
            _, binary = cv2.threshold(gray, 50, 255, cv2.THRESH_BINARY)
            dark_ratio = np.sum(binary == 0) / binary.size
            
            if dark_ratio > 0.6:
                indicators['shadow_anomalies'] = 0.3
                indicators['issues'].append('Excessive dark areas - possible fake shadows')
            
            # Detect blending artifacts at edges
            edges = cv2.Canny(gray, 100, 200)
            edge_pixels = np.sum(edges > 0)
            
            if edge_pixels > (gray.size * 0.15):
                indicators['blending_artifacts'] = 0.4
                indicators['issues'].append('High edge density - possible poor blending of composite image')
        
        except Exception as e:
            indicators['issues'].append(f'Inconsistency detection error: {str(e)}')
        
        return indicators
    
    def _calculate_risk_score(self, results: Dict) -> float:
        """Calculate overall risk score based on all detectors."""
        scores = []
        
        for key in ['manipulation_indicators', 'fake_interface_indicators', 
                    'chart_tampering_indicators', 'inconsistency_indicators']:
            if key in results:
                indicators = results[key]
                for detector_key, value in indicators.items():
                    if isinstance(value, (int, float)) and detector_key != 'issues':
                        scores.append(value)
        
        if not scores:
            return 0
        
        # Average of all indicator scores
        return min(max(np.mean(scores), 0), 1)
    
    def get_suspicious_details(self, analysis_results: Dict) -> List[Dict]:
        """
        Format analysis results into readable suspicious details.
        """
        details = []
        
        categories = {
            'Manipulation Detected': analysis_results.get('manipulation_indicators', {}),
            'Fake Interface Detected': analysis_results.get('fake_interface_indicators', {}),
            'Chart Tampering Detected': analysis_results.get('chart_tampering_indicators', {}),
            'Inconsistencies Found': analysis_results.get('inconsistency_indicators', {})
        }
        
        for category, indicators in categories.items():
            if indicators.get('issues'):
                for issue in indicators['issues']:
                    details.append({
                        'category': category,
                        'issue': issue,
                        'confidence': max([v for k, v in indicators.items() if k != 'issues' and isinstance(v, (int, float))], default=0)
                    })
        
        return details
