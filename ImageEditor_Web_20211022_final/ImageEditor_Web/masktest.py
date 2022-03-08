import cv2

# img_in = cv2.imread('photoshop.png', cv2.IMREAD_UNCHANGED)
# cv2.imshow('inptu', img_in)

img_in = cv2.imread('download.png', cv2.IMREAD_UNCHANGED)
# img_in = cv2.cvtColor(img_in, cv2.COLOR_BGR2GRAY)
cv2.imshow('input', img_in)

try:
    red, green, blue, alpha = cv2.split(img_in)
    blur1 = cv2.GaussianBlur(255 - img_in, (31, 31), 51)
    ret, thresh1 = cv2.threshold(blur1, 120, 255, cv2.THRESH_BINARY)
    # cv2.imwrite('mask.png', thresh1)
    # cv2.imshow('alpha', cv2.resize(alpha, (512, 384)))
    cv2.imshow('GaussianBlur', blur1)
    cv2.imshow('BlurCore', thresh1)
    cv2.waitKey(0)
except Exception as ex:
    print(ex.__str__())
print('end of test')
