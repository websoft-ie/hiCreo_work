<?php
Class resize //Harvey August 5 2019 Created /2930 
{
	private $image;
	private $width;
	private $height;
	private $imageResized;
	
	
	public function __construct($fileName)
	{
		$this->image = $this->openImage($fileName);
		$this->width = imagesx($this->image);
		$this->height = imagesy($this->image);
	}
	
	private function openImage($file){
		$extension = mime_content_type($file);//strtolower(strrchr($file, '.')); //Harvey 20200129 3883. extension can be changed easily
		switch($extension){
			case 'image/jpeg':
			case '.jpg':
			case '.jpeg':
				$img = @imagecreatefromjpeg($file);
				break;
			case 'image/gif':
			case '.gif':
				$img = @imagecreatefromgif($file);
				break;
			case 'image/png':
			case '.png':
				$img = @imagecreatefrompng($file);
				
				/*try {
				    $img = imagecreatefrompng($file);
				} catch (Exception $e) {
				    echo 'Caught exception: ',  $e->getMessage(), "\n";
				}
				
				var_dump("Result: ".$img);*/
				break;
			default:
				$img = false;
				break;
		}
		return $img;
	}
	
	public function resizeImage($newWidth, $newHeight, $option="auto")
	{
	    // *** Get optimal width and height - based on $option
	    $optionArray = $this->getDimensions($newWidth, $newHeight, strtolower($option));
	 
	    $optimalWidth  = $optionArray['optimalWidth'];
	    $optimalHeight = $optionArray['optimalHeight'];
		
	    // *** Resample - create image canvas of x, y size
	    $this->imageResized = imagecreatetruecolor($optimalWidth, $optimalHeight);
	    imagecopyresampled($this->imageResized, $this->image, 0, 0, 0, 0, $optimalWidth, $optimalHeight, $this->width, $this->height);
	 
	    // // *** if option is 'crop', then crop too
	    // if ($option == 'crop') {
	    //     $this->crop($optimalWidth, $optimalHeight, $newWidth, $newHeight);
	    // }
	}
	
	private function getDimensions($newWidth, $newHeight, $option)
	{
	 
	   switch ($option)
	    {
	        case 'exact':
	            $optimalWidth = $newWidth;
	            $optimalHeight= $newHeight;
	            break;
	        case 'portrait':
	            $optimalWidth = $this->getSizeByFixedHeight($newHeight);
	            $optimalHeight= $newHeight;
	            break;
	        case 'landscape':
	            $optimalWidth = $newWidth;
	            $optimalHeight= $this->getSizeByFixedWidth($newWidth);
	            break;
	        case 'auto':
	            $optionArray = $this->getSizeByAuto($newWidth, $newHeight);
	            $optimalWidth = $optionArray['optimalWidth'];
	            $optimalHeight = $optionArray['optimalHeight'];
	            break;
	        case 'crop':
	            $optionArray = $this->getOptimalCrop($newWidth, $newHeight);
	            $optimalWidth = $optionArray['optimalWidth'];
	            $optimalHeight = $optionArray['optimalHeight'];
	            break;
	    }
	    return array('optimalWidth' => $optimalWidth, 'optimalHeight' => $optimalHeight);
	}
	
	private function getSizeByFixedHeight($newHeight)
	{
	    $ratio = $this->width / $this->height;
	    $newWidth = $newHeight * $ratio;
	    return $newWidth;
	}
	 
	private function getSizeByFixedWidth($newWidth)
	{
	    $ratio = $this->height / $this->width;
	    $newHeight = $newWidth * $ratio;
	    return $newHeight;
	}
	 
	private function getSizeByAuto($newWidth, $newHeight)
	{
	    if ($this->height > $this->width)
	    // *** Image to be resized is wider (landscape)
	    {
	        $optimalWidth = $newWidth;
	        $optimalHeight= $this->getSizeByFixedWidth($newWidth);
	    }
	    elseif ($this->height < $this->width)
	    // *** Image to be resized is taller (portrait)
	    {
	        $optimalWidth = $this->getSizeByFixedHeight($newHeight);
	        $optimalHeight= $newHeight;
	    }
	    else
	    // *** Image to be resizerd is a square
	    {
	        if ($newHeight < $newWidth) {
	            $optimalWidth = $newWidth;
	            $optimalHeight= $this->getSizeByFixedWidth($newWidth);
	        } else if ($newHeight > $newWidth) {
	            $optimalWidth = $this->getSizeByFixedHeight($newHeight);
	            $optimalHeight= $newHeight;
	        } else {
	            // *** Sqaure being resized to a square
	            $optimalWidth = $newWidth;
	            $optimalHeight= $newHeight;
	        }
	    }
	 
	    return array('optimalWidth' => $optimalWidth, 'optimalHeight' => $optimalHeight);
	}
	 
	private function getOptimalCrop($newWidth, $newHeight)
	{
	 
	    $heightRatio = $this->height / $newHeight;
	    $widthRatio  = $this->width /  $newWidth;
	 
	    if ($heightRatio < $widthRatio) {
	        $optimalRatio = $heightRatio;
	    } else {
	        $optimalRatio = $widthRatio;
	    }
	 
	    $optimalHeight = $this->height / $optimalRatio;
	    $optimalWidth  = $this->width  / $optimalRatio;
	 
	    return array('optimalWidth' => $optimalWidth, 'optimalHeight' => $optimalHeight);
	}
	
	
	public function saveImage($savePath, $imageQuality="100")
	{
	    // *** Get extension
	    $extension = strrchr($savePath, '.');
	    $extension = strtolower($extension);
	 
	    switch($extension)
	    {
	        case '.jpg':
	        case '.jpeg':
	            if (imagetypes() & IMG_JPG) {
	                imagejpeg($this->imageResized, $savePath, $imageQuality);
	            }
	            break;
	 
	        case '.gif':
	            if (imagetypes() & IMG_GIF) {
	                imagegif($this->imageResized, $savePath);
	            }
	            break;
	 
	        case '.png':
				$background = imagecolorallocate($this->imageResized , 0, 0, 0);
				// removing the black from the placeholder
				imagecolortransparent($this->imageResized, $background);
		
				// turning off alpha blending (to ensure alpha channel information
				// is preserved, rather than removed (blending with the rest of the
				// image in the form of black))
				imagealphablending($this->imageResized, false);
		
				// turning on alpha channel information saving (to ensure the full range
				// of transparency is preserved)
				imagesavealpha($this->imageResized, true);

	            break;
	 
	        // ... etc
	 
	        default:
	            // *** No extension - No save.
	            break;
	    }
	 
	    imagedestroy($this->imageResized);
	}
}
?>
