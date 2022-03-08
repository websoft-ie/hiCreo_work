function addMasks(mask, old) {
	let oldData = old.data,
		newData = mask.data,
		w = mask.width,
		h = mask.height,
		oldBound = old.bounds,
		newBound = mask.bounds,
		resBound = {
			minX: Math.min(oldBound.minX, newBound.minX),
			minY: Math.min(oldBound.minY, newBound.minY),
			maxX: Math.max(oldBound.maxX, newBound.maxX),
			maxY: Math.max(oldBound.maxY, newBound.maxY)
		};
	let result = new Uint8Array(w * h);
	for(i = resBound.minY; i <= resBound.maxY; i++) {
		for(j = resBound.minX; j <= resBound.maxX; j++) {
			index = i * w + j;
			if(oldData[index] == 1 || newData[index] == 1) {
				result[index] = 1;
			}
		}
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: resBound
	};
}

function subtractMasks(mask, old) {
	let oldData = old.data,
		newData = mask.data,
		w = mask.width,
		h = mask.height,
		oldBound = old.bounds,
		newBound = mask.bounds,
		resBound = oldBound;
	let result = new Uint8Array(w * h);
	for(i = oldBound.minY; i <= oldBound.maxY; i++) {
		for(j = oldBound.minX; j <= oldBound.maxX; j++) {
			index = i * w + j;
			if(oldData[index] == 1) {
				if(newData[index] == 0) {
					result[index] = 1;
				}
			}
		}
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: resBound
	};
}

function intersectMasks(mask, old) {
	let oldData = old.data,
		newData = mask.data,
		w = mask.width,
		h = mask.height,
		oldBound = old.bounds,
		newBound = mask.bounds,
		resBound = {
			minX: Math.max(oldBound.minX, newBound.minX),
			minY: Math.max(oldBound.minY, newBound.minY),
			maxX: Math.min(oldBound.maxX, newBound.maxX),
			maxY: Math.min(oldBound.maxY, newBound.maxY)
		};
	let result = new Uint8Array(w * h);
	for(i = resBound.minY; i <= resBound.maxY; i++) {
		for(j = resBound.minX; j <= resBound.maxX; j++) {
			index = i * w + j;
			if(oldData[index] == 1) {
				if(newData[index] == 1) {
					result[index] = 1;
				}
			}
		}
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: resBound
	};
}

function concatMasks(mask, old) {
	let data1 = old.data,
		data2 = mask.data,
		w1 = old.width,
		w2 = mask.width,
		b1 = old.bounds,
		b2 = mask.bounds,
		b = { // bounds for new mask
			minX: Math.min(b1.minX, b2.minX),
			minY: Math.min(b1.minY, b2.minY),
			maxX: Math.max(b1.maxX, b2.maxX),
			maxY: Math.max(b1.maxY, b2.maxY)
		},
		w = old.width, // size for new mask
		h = old.height,
		i, j, k, k1, k2, len;
	let result = new Uint8Array(w * h);
	// copy all old mask
	len = b1.maxX - b1.minX + 1;
	i = b1.minY * w + b1.minX;
	k1 = b1.minY * w1 + b1.minX;
	k2 = b1.maxY * w1 + b1.minX + 1;
	// walk through rows (Y)
	for(k = k1; k < k2; k += w1) {
		result.set(data1.subarray(k, k + len), i); // copy row
		i += w;
	}
	// copy new mask (only "black" pixels)
	len = b2.maxX - b2.minX + 1;
	i = b2.minY * w + b2.minX;
	k1 = b2.minY * w2 + b2.minX;
	k2 = b2.maxY * w2 + b2.minX + 1;
	// walk through rows (Y)
	for(k = k1; k < k2; k += w2) {
		// walk through cols (X)
		for(j = 0; j < len; j++) {
			if(data2[k + j] === 1) result[i + j] = 1;
		}
		i += w;
	}
	return {
		data: result,
		width: w,
		height: h,
		bounds: b
	};
}